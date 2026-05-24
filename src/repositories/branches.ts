import { and, asc, count, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import { branches } from "../model/branch";
import { assets } from "../model/asset";
import { CreateBranchInput, UpdateBranchInput } from "../types/branches";
import { AppError, ConflictError, DatabaseError } from "../utils/error";

type PgLikeError = {
  code?: string;
  constraint?: string;
  detail?: string;
  message?: string;
  cause?: unknown;
  originalError?: unknown;
};

const unwrapPgError = (input: unknown): PgLikeError | undefined => {
  const seen = new Set<unknown>();
  const queue: unknown[] = [input];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);

    const candidate = current as PgLikeError;
    if (candidate.code || candidate.constraint || candidate.detail) return candidate;
    if (candidate.cause) queue.push(candidate.cause);
    if (candidate.originalError) queue.push(candidate.originalError);
  }

  return undefined;
};

const mapBranchDbError = (error: unknown): never => {
  if (error instanceof AppError) throw error;

  const wrapped = error as { message?: string };
  const dbError = unwrapPgError(error) ?? (error as PgLikeError);

  if (dbError.code === "23505") {
    if (dbError.constraint === "branches_org_name_uq") {
      throw new ConflictError("Branch name already exists in this organization");
    }
    if (dbError.constraint === "branches_org_code_uq") {
      throw new ConflictError("Branch code already exists in this organization");
    }
    throw new ConflictError("Duplicate value violates unique constraint");
  }

  throw new DatabaseError(
    dbError.detail || dbError.message || wrapped.message || "Branch data operation failed",
    false,
  );
};

export const createBranch = async (
  organizationId: string,
  actorUserId: string,
  payload: CreateBranchInput,
) => {
  try {
    const [record] = await db
      .insert(branches)
      .values({
        organizationId,
        name: payload.name,
        code: payload.code ?? null,
        description: payload.description ?? null,
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      })
      .returning();

    if (!record) {
      throw new DatabaseError("Failed to create branch");
    }

    return record;
  } catch (error) {
    mapBranchDbError(error);
  }
};

export const listBranches = async (organizationId: string) =>
  db
    .select()
    .from(branches)
    .where(and(eq(branches.organizationId, organizationId), isNull(branches.deletedAt)))
    .orderBy(asc(branches.name));

export const findBranchById = async (organizationId: string, branchId: string) => {
  const [record] = await db
    .select()
    .from(branches)
    .where(
      and(
        eq(branches.organizationId, organizationId),
        eq(branches.id, branchId),
        isNull(branches.deletedAt),
      ),
    )
    .limit(1);

  return record;
};

export const updateBranchById = async (
  organizationId: string,
  branchId: string,
  actorUserId: string,
  payload: UpdateBranchInput,
) => {
  const updatePayload: Partial<typeof branches.$inferInsert> = {
    updatedByUserId: actorUserId,
    updatedAt: new Date(),
  };

  if (payload.name !== undefined) updatePayload.name = payload.name;
  if (payload.code !== undefined) updatePayload.code = payload.code;
  if (payload.description !== undefined) updatePayload.description = payload.description;

  try {
    const [record] = await db
      .update(branches)
      .set(updatePayload)
      .where(
        and(
          eq(branches.organizationId, organizationId),
          eq(branches.id, branchId),
          isNull(branches.deletedAt),
        ),
      )
      .returning();

    return record;
  } catch (error) {
    mapBranchDbError(error);
  }
};

export const softDeleteBranchById = async (
  organizationId: string,
  branchId: string,
  actorUserId: string,
) => {
  const [record] = await db
    .update(branches)
    .set({
      deletedAt: new Date(),
      updatedByUserId: actorUserId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(branches.organizationId, organizationId),
        eq(branches.id, branchId),
        isNull(branches.deletedAt),
      ),
    )
    .returning();

  return record;
};

export const countActiveAssetsInBranch = async (
  organizationId: string,
  branchId: string,
) => {
  const [result] = await db
    .select({ total: count() })
    .from(assets)
    .where(
      and(
        eq(assets.organizationId, organizationId),
        eq(assets.branchId, branchId),
        isNull(assets.deletedAt),
      ),
    );

  return Number(result?.total ?? 0);
};
