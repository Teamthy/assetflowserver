import { NextFunction, Request, Response } from "express";
import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "../db";
import {
  organizationUsers,
  organizations,
  permissions,
  rolePermissions,
  roles,
  userRoles,
} from "../model";
import { AuthenticationError, AuthorizationError } from "../utils/error";

export const requirePermission =
  (permissionKey: string) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.auth?.userId || !req.auth.organizationId) {
        throw new AuthenticationError();
      }

      const [authorized] = await db
        .select({ organizationId: organizations.id })
        .from(organizationUsers)
        .innerJoin(
          organizations,
          eq(organizations.id, organizationUsers.organizationId),
        )
        .leftJoin(
          userRoles,
          and(
            eq(userRoles.userId, organizationUsers.userId),
            eq(userRoles.organizationId, organizationUsers.organizationId),
          ),
        )
        .leftJoin(roles, eq(roles.id, userRoles.roleId))
        .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
        .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
        .where(
          and(
            eq(organizationUsers.userId, req.auth.userId),
            eq(organizationUsers.organizationId, req.auth.organizationId),
            eq(organizationUsers.status, "active"),
            eq(organizations.isActive, true),
            isNull(organizations.deletedAt),
            or(
              eq(organizations.ownerUserId, req.auth.userId),
              eq(roles.name, "admin"),
              eq(permissions.key, permissionKey),
            ),
          ),
        )
        .limit(1);

      if (!authorized) {
        throw new AuthorizationError("Missing required permission");
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
