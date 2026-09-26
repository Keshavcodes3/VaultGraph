import { createHash, randomBytes } from "node:crypto";
import type { WorkspaceRole } from "@repo/shared/workspace-types";
import { WORKSPACE_ROLE_RANK } from "./workspace.constants";

/**
 * Generate a cryptographically secure raw invitation token (256 bits,
 * base64url). The raw token is delivered to the invitee exactly once and
 * never persisted or logged — only its SHA-256 hash is stored.
 */
export const generateInvitationToken = (): string => {
  return randomBytes(32).toString("base64url");
};

/** SHA-256 hash of a raw invitation token for database storage/lookup. */
export const hashInvitationToken = (token: string): string => {
  return createHash("sha256").update(token, "utf8").digest("hex");
};

export const normalizeInvitationEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

export const roleRank = (role: WorkspaceRole): number => {
  return WORKSPACE_ROLE_RANK[role] ?? 0;
};

/** OWNER and ADMIN members may manage invitations and members. */
export const canManageWorkspace = (role: WorkspaceRole): boolean => {
  return roleRank(role) >= WORKSPACE_ROLE_RANK.ADMIN;
};

/**
 * Whether `requesterRole` may invite someone as `targetRole`.
 * Owners can invite any role; admins cannot create new owners.
 */
export const canInviteAs = (
  requesterRole: WorkspaceRole,
  targetRole: WorkspaceRole
): boolean => {
  if (!canManageWorkspace(requesterRole)) return false;
  if (targetRole === "OWNER" && requesterRole !== "OWNER") return false;
  return true;
};

/**
 * Whether `requesterRole` may change `targetRole` to `nextRole`.
 * Only owners may touch owners (or grant the owner role).
 */
export const canChangeRole = (
  requesterRole: WorkspaceRole,
  targetRole: WorkspaceRole,
  nextRole: WorkspaceRole
): boolean => {
  if (!canManageWorkspace(requesterRole)) return false;
  if (requesterRole !== "OWNER") {
    if (targetRole === "OWNER" || nextRole === "OWNER") return false;
  }
  return true;
};

/**
 * Whether `requesterRole` may remove a member with `targetRole`.
 * Admins cannot remove owners; owners can remove anyone (subject to the
 * last-owner guard enforced by the service).
 */
export const canRemoveMember = (
  requesterRole: WorkspaceRole,
  targetRole: WorkspaceRole
): boolean => {
  if (!canManageWorkspace(requesterRole)) return false;
  if (requesterRole !== "OWNER" && targetRole === "OWNER") return false;
  return true;
};

/** Terminal invitation states — the invitation can never become usable. */
export const isTerminalInvitationStatus = (status: string): boolean => {
  return (
    status === "ACCEPTED" ||
    status === "REJECTED" ||
    status === "EXPIRED" ||
    status === "CANCELLED" ||
    status === "REVOKED"
  );
};

/** Revoked-equivalent states (REVOKED is current; CANCELLED is legacy). */
export const isRevokedInvitationStatus = (status: string): boolean => {
  return status === "REVOKED" || status === "CANCELLED";
};
