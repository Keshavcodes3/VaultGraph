import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceRole,
} from "@repo/shared/workspace-types";

import { db } from "../../../prisma/db";
import { HttpError } from "../../../Shared/httpError";
import { AuthRepository } from "../../auth/repositary/auth.repo";
import { workspaceRepoClass } from "../Repostiary/workspace.repositary";
import { memberRepoClass } from "../Repostiary/member.repositary";

import {
  WorkspaceAccessDeniedError,
  WorkspaceNotFoundError,
  WorkspaceSlugAlreadyExistsError,
} from "../utils/workspace.errors";

import {
  generateWorkspaceSlug,
  normalizeWorkspaceName,
  normalizeWorkspaceSlug,
} from "../utils/workspace.utils";

export class workspaceServiceClass {
  constructor(
    private readonly workspaceRepo: workspaceRepoClass,
    private readonly memberRepo: memberRepoClass,
    private readonly authRepo: AuthRepository
  ) {}

  // Effective role: legacy owner counts as OWNER, else membership role.
  private getEffectiveRole = async (
    workspace: { id: string; ownerId: string },
    userId: string
  ): Promise<WorkspaceRole | null> => {
    if (workspace.ownerId === userId) {
      return "OWNER";
    }
    const membership =
      await this.memberRepo.findByWorkspaceAndUser(
        workspace.id,
        userId
      );
    return (membership?.role as WorkspaceRole | undefined) ?? null;
  };

  // The workspace owner must always hold an OWNER membership
  // (backfills legacy workspaces created before memberships existed).
  private ensureOwnerMembership = async (workspace: {
    id: string;
    ownerId: string;
  }) => {
    const existing =
      await this.memberRepo.findByWorkspaceAndUser(
        workspace.id,
        workspace.ownerId
      );
    if (existing) return;
    const owner = await this.authRepo.findById(workspace.ownerId);
    if (!owner) return;
    try {
      await this.memberRepo.create({
        workspaceId: workspace.id,
        userId: workspace.ownerId,
        role: "OWNER",
      });
    } catch {
      // Concurrent backfill — the unique constraint is the arbiter.
    }
  };

  // CREATE WORKSPACE
  create = async (
    data: CreateWorkspaceInput,
    ownerId: string
  ) => {
    // Defensive: routes validate the body, but a missing/unparsed JSON body
    // (e.g. no Content-Type: application/json) would otherwise crash with a
    // TypeError on `data.name`. Fail with a clear 400 instead.
    if (!data || typeof data.name !== "string") {
      throw new HttpError("Workspace name is required", 400);
    }
    const name = normalizeWorkspaceName(data.name);

    const slug = normalizeWorkspaceSlug(
      data.slug || generateWorkspaceSlug(name)
    );

    if (!slug) {
      throw new HttpError(
        "Could not generate a valid slug from the workspace name",
        400
      );
    }

    const existingWorkspace =
      await this.workspaceRepo.getWorkspaceBySlug(slug);

    if (existingWorkspace) {
      throw new WorkspaceSlugAlreadyExistsError();
    }

    // Workspace + OWNER membership are created atomically so a workspace
    // never exists without its owner's membership.
    return await db.transaction(async (tx) => {
      const txWorkspaceRepo = new workspaceRepoClass(
        tx.orm.public.Workspace
      );
      const txMemberRepo = new memberRepoClass(
        tx.orm.public.Member,
        tx.orm.public.User
      );
      const workspace = await txWorkspaceRepo.create(
        {
          name,
          slug,
        },
        ownerId
      );
      await txMemberRepo.create({
        workspaceId: workspace.id as string,
        userId: ownerId,
        role: "OWNER",
      });
      return workspace;
    });
  };

  // GET WORKSPACE
  getById = async (
    workspaceId: string,
    ownerId: string
  ) => {
    const workspace =
      await this.workspaceRepo.getWorkspaceById(workspaceId);

    if (!workspace) {
      throw new WorkspaceNotFoundError();
    }

    const role = await this.getEffectiveRole(
      workspace as { id: string; ownerId: string },
      ownerId
    );
    if (!role) {
      throw new WorkspaceAccessDeniedError();
    }

    await this.ensureOwnerMembership(
      workspace as { id: string; ownerId: string }
    );

    return workspace;
  };

  // GET ALL USER WORKSPACES (owned + member of)
  getAll = async (ownerId: string) => {
    const owned = await this.workspaceRepo.getAllWorkspaces(ownerId);

    const memberships = await this.memberRepo.findByUser(ownerId);
    const memberWorkspaceIds = [
      ...new Set(
        memberships.map((m) => m.workspaceId as string)
      ),
    ].filter((id) => !owned.some((w) => (w.id as string) === id));

    const shared = await this.workspaceRepo.findByIds(
      memberWorkspaceIds
    );

    // Backfill OWNER memberships for legacy owned workspaces.
    for (const w of owned) {
      await this.ensureOwnerMembership(
        w as unknown as { id: string; ownerId: string }
      );
    }

    return [...owned, ...shared];
  };

  // GET WORKSPACE BY SLUG
  getBySlug = async (
    slug: string,
    ownerId: string
  ) => {
    const workspace = await this.workspaceRepo.getWorkspaceBySlug(
      normalizeWorkspaceSlug(slug)
    );

    if (!workspace) {
      throw new WorkspaceNotFoundError();
    }

    const role = await this.getEffectiveRole(
      workspace as { id: string; ownerId: string },
      ownerId
    );
    if (!role) {
      throw new WorkspaceAccessDeniedError();
    }

    await this.ensureOwnerMembership(
      workspace as { id: string; ownerId: string }
    );

    return workspace;
  };

  // UPDATE WORKSPACE (effective owners only)
  update = async (
    workspaceId: string,
    ownerId: string,
    data: UpdateWorkspaceInput
  ) => {
    if (!data || (data.name === undefined && data.slug === undefined)) {
      throw new HttpError("Nothing to update", 400);
    }

    const workspace =
      await this.workspaceRepo.getWorkspaceById(workspaceId);

    if (!workspace) {
      throw new WorkspaceNotFoundError();
    }

    const role = await this.getEffectiveRole(
      workspace as { id: string; ownerId: string },
      ownerId
    );
    if (role !== "OWNER") {
      throw new WorkspaceAccessDeniedError();
    }

    const updateData: {
      name?: string;
      slug?: string;
    } = {};

    if (data.name !== undefined) {
      updateData.name = normalizeWorkspaceName(data.name);
    }

    if (data.slug !== undefined) {
      const slug = normalizeWorkspaceSlug(data.slug);

      if (slug !== workspace.slug) {
        const existingWorkspace =
          await this.workspaceRepo.getWorkspaceBySlug(slug);

        if (existingWorkspace) {
          throw new WorkspaceSlugAlreadyExistsError();
        }
      }

      updateData.slug = slug;
    }

    return await this.workspaceRepo.updateById(
      workspaceId,
      updateData
    );
  };

  // DELETE WORKSPACE (effective owners only)
  delete = async (
    workspaceId: string,
    ownerId: string
  ) => {
    const workspace =
      await this.workspaceRepo.getWorkspaceById(workspaceId);

    if (!workspace) {
      throw new WorkspaceNotFoundError();
    }

    const role = await this.getEffectiveRole(
      workspace as { id: string; ownerId: string },
      ownerId
    );
    if (role !== "OWNER") {
      throw new WorkspaceAccessDeniedError();
    }

    await this.workspaceRepo.delete(
      workspaceId,
      workspace.ownerId as string
    );
  };

  // CHECK OWNERSHIP
  isOwner = async (
    workspaceId: string,
    ownerId: string
  ) => {
    return await this.workspaceRepo.isOwner(
      workspaceId,
      ownerId
    );
  };
}
