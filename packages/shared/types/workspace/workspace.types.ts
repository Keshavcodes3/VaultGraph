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
