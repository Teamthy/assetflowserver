import { env } from "./env";

/**
 * Demo / present-deployment switch.
 * Set ENFORCE_RBAC=true to restore strict permission and scope checks.
 * Auth (login / JWT) is never bypassed.
 */
export const isRbacEnforced = (): boolean => env.ENFORCE_RBAC;
