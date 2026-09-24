import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                  Schemas                                   */
/* -------------------------------------------------------------------------- */

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(100, "Workspace name is too long"),

  slug: z
    .string()
    .min(1, "Workspace slug is required")
    .max(100, "Workspace slug is too long")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug can only contain lowercase letters, numbers and hyphens"
    )
    // Optional: the server generates one from `name` when omitted.
    .optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name cannot be empty")
    .max(100, "Workspace name is too long")
    .optional(),

  slug: z
    .string()
    .min(1, "Workspace slug cannot be empty")
    .max(100, "Workspace slug is too long")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug can only contain lowercase letters, numbers and hyphens"
    )
    .optional(),
});

export const workspaceIdSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID"),
});

/* -------------------------------------------------------------------------- */
/*                        Membership + Invitation schemas                     */
/* -------------------------------------------------------------------------- */

export const workspaceRoleSchema = z.enum([
  "OWNER",
  "ADMIN",
  "MEMBER",
  "VIEWER",
]);

export const invitationStatusSchema = z.enum([
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
  "REVOKED",
]);

export const createInvitationSchema = z.object({
  email: z.email("Enter a valid email address"),
  role: workspaceRoleSchema.default("MEMBER"),
});

export const updateMemberRoleSchema = z.object({
  role: workspaceRoleSchema,
});

export const transferOwnershipSchema = z.object({
  // The workspace member (user id) receiving ownership.
  targetUserId: z.string().uuid("Invalid member id"),
});

export const invitationListQuerySchema = z.object({
  status: invitationStatusSchema.optional(),
});

/* -------------------------------------------------------------------------- */
/*                                   Inputs                                   */
/* -------------------------------------------------------------------------- */

export type CreateWorkspaceInput = z.infer<
  typeof createWorkspaceSchema
>;

export type UpdateWorkspaceInput = z.infer<
  typeof updateWorkspaceSchema
>;

export type WorkspaceIdInput = z.infer<
  typeof workspaceIdSchema
>;

export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;

export type InvitationStatus = z.infer<
  typeof invitationStatusSchema
>;

export type CreateInvitationInput = z.infer<
  typeof createInvitationSchema
>;

export type UpdateMemberRoleInput = z.infer<
  typeof updateMemberRoleSchema
>;

export type TransferOwnershipInput = z.infer<
  typeof transferOwnershipSchema
>;

/* -------------------------------------------------------------------------- */
/*                                  Database                                  */
/* -------------------------------------------------------------------------- */

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

/* -------------------------------------------------------------------------- */
/*                                  Responses                                 */
/* -------------------------------------------------------------------------- */

export interface WorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceListResponse {
  workspaces: WorkspaceResponse[];
}

/* -------------------------------------------------------------------------- */
/*                       Membership + Invitation domain                       */
/* -------------------------------------------------------------------------- */

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  status: InvitationStatus;
  invitedById: string | null;
  expiresAt: Date | null;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/* -------------------------------------------------------------------------- */
/*                                  Responses                                 */
/* -------------------------------------------------------------------------- */

export interface MemberUserSummary {
  id: string;
  username: string;
  email: string;
}

export interface MemberResponse {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: Date;
  updatedAt: Date;
  user: MemberUserSummary;
}

/** Safe invitation fields — never includes the token or its hash. */
export interface InvitationResponse {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  status: InvitationStatus;
  invitedById: string | null;
  invitedBy: MemberUserSummary | null;
  expiresAt: Date | null;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Returned once when an invitation is created or resent. `token` is the raw
 * single-use token (delivered to the invitee, never stored); every later
 * response uses InvitationResponse instead.
 */
export interface CreateInvitationResponse {
  invitation: InvitationResponse;
  token: string;
  acceptUrl: string;
  emailSent: boolean;
}

/** Public invitation details for the accept page (no auth required). */
export interface InvitationDetailsResponse {
  workspace: {
    id: string;
    name: string;
  };
  invitedBy: {
    name: string;
  } | null;
  email: string;
  role: WorkspaceRole;
  status: InvitationStatus;
  expiresAt: Date | null;
}
