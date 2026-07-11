import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import { approvals } from "../model/approvals";

// ─── Create Approval Request ──────────────────────────────────────────────────

export async function createApprovalRequest(input: {
  organizationId: string;
  assetId: string;
  type: "disposal" | "transfer";
  requestedByUserId: string;
  payload: Record<string, unknown>;
  requesterNotes?: string;
  expiresAt?: Date;
}): Promise<typeof approvals.$inferSelect> {
  const [record] = await db
    .insert(approvals)
    .values({
      organizationId: input.organizationId,
      assetId: input.assetId,
      type: input.type,
      status: "pending",
      requestedByUserId: input.requestedByUserId,
      payload: input.payload,
      requesterNotes: input.requesterNotes ?? null,
      expiresAt: input.expiresAt ?? null,
    })
    .returning();

  return record;
}

// ─── Find Pending Approval ────────────────────────────────────────────────────

export async function findPendingApproval(
  organizationId: string,
  assetId: string,
  type: "disposal" | "transfer"
): Promise<typeof approvals.$inferSelect | null> {
  const [record] = await db
    .select()
    .from(approvals)
    .where(
      and(
        eq(approvals.organizationId, organizationId),
        eq(approvals.assetId, assetId),
        eq(approvals.type, type),
        eq(approvals.status, "pending")
      )
    )
    .limit(1);

  return record ?? null;
}

// ─── Find Approval By ID ──────────────────────────────────────────────────────

export async function findApprovalById(
  organizationId: string,
  approvalId: string
): Promise<typeof approvals.$inferSelect | null> {
  const [record] = await db
    .select()
    .from(approvals)
    .where(
      and(
        eq(approvals.organizationId, organizationId),
        eq(approvals.id, approvalId)
      )
    )
    .limit(1);

  return record ?? null;
}

// ─── Decide Approval ──────────────────────────────────────────────────────────

export async function decideApproval(
  organizationId: string,
  approvalId: string,
  approverUserId: string,
  decision: "approved" | "rejected",
  approverNotes?: string
): Promise<typeof approvals.$inferSelect | null> {
  const [record] = await db
    .update(approvals)
    .set({
      status: decision,
      approvedByUserId: approverUserId,
      approverNotes: approverNotes ?? null,
      decidedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(approvals.organizationId, organizationId),
        eq(approvals.id, approvalId),
        eq(approvals.status, "pending")
      )
    )
    .returning();

  return record ?? null;
}

// ─── List Pending Approvals ───────────────────────────────────────────────────

export async function listPendingApprovals(
  organizationId: string,
  type?: "disposal" | "transfer"
): Promise<(typeof approvals.$inferSelect)[]> {
  const filters = [
    eq(approvals.organizationId, organizationId),
    eq(approvals.status, "pending"),
  ];

  if (type) {
    filters.push(eq(approvals.type, type));
  }

  return db
    .select()
    .from(approvals)
    .where(and(...filters))
    .orderBy(desc(approvals.createdAt));
}

// ─── List Asset Approvals ─────────────────────────────────────────────────────

export async function listAssetApprovals(
  organizationId: string,
  assetId: string
): Promise<(typeof approvals.$inferSelect)[]> {
  return db
    .select()
    .from(approvals)
    .where(
      and(
        eq(approvals.organizationId, organizationId),
        eq(approvals.assetId, assetId)
      )
    )
    .orderBy(desc(approvals.createdAt));
}