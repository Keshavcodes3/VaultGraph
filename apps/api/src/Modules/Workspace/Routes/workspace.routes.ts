import { Router } from "express";

import { authenticate } from "../../../Middleware/auth.middleware";

import { workspaceRepoClass } from "../Repostiary/workspace.repositary";
import { workspaceServiceClass } from "../service/workspace.service";
import { workspaceControllerClass } from "../Controller/workspace.controller";

import { db } from "../../../prisma/db";

const router = Router();

const workspaceRepo = new workspaceRepoClass(
  db.orm.public.Workspace
);

const workspaceService = new workspaceServiceClass(
  workspaceRepo
);

const workspaceController = new workspaceControllerClass(
  workspaceService
);

// All workspace routes require authentication
router.use(authenticate);

// Create workspace
router.post(
  "/",
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
  workspaceController.update
);

// Delete workspace
router.delete(
  "/:workspaceId",
  workspaceController.delete
);

export default router;
