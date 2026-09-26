import { Router } from "express";

import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
} from "@repo/shared/workspace-types";
import { validateBody } from "../../../Shared/validate";
import { authenticate } from "../../../Middleware/auth.middleware";

import { workspaceRepoClass } from "../Repostiary/workspace.repositary";
import { memberRepoClass } from "../Repostiary/member.repositary";
import { workspaceServiceClass } from "../service/workspace.service";
import { workspaceControllerClass } from "../Controller/workspace.controller";

import { authRepository } from "../../auth/repositary/auth.repo";
import { db } from "../../../prisma/db";

const router = Router();

const workspaceRepo = new workspaceRepoClass(
  db.orm.public.Workspace
);

const memberRepo = new memberRepoClass(
  db.orm.public.Member,
  db.orm.public.User
);

const workspaceService = new workspaceServiceClass(
  workspaceRepo,
  memberRepo,
  authRepository
);

const workspaceController = new workspaceControllerClass(
  workspaceService
);

// All workspace routes require authentication
router.use(authenticate);

// Create workspace
router.post(
  "/",
  validateBody(createWorkspaceSchema),
  workspaceController.create
);

// Get all user's workspaces
router.get(
  "/",
  workspaceController.getAll
);

// Get workspace by slug
router.get(
  "/slug/:slug",
  workspaceController.getBySlug
);

// Get workspace by ID
router.get(
  "/:workspaceId",
  workspaceController.getById
);

// Update workspace
router.patch(
  "/:workspaceId",
  validateBody(updateWorkspaceSchema),
  workspaceController.update
);

// Delete workspace
router.delete(
  "/:workspaceId",
  workspaceController.delete
);

export default router;
