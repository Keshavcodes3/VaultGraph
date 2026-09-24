import { Router } from "express";

import {
  createProjectSchema,
  updateProjectSchema,
} from "@repo/shared/project-types";
import { validateBody } from "../../../Shared/validate";
import { authenticate } from "../../../Middleware/auth.middleware";

import { workspaceRepoClass } from "../../Workspace/Repostiary/workspace.repositary";
import { projectRepoClass } from "../Repositary/project.repo";
import { projectServiceClass } from "../service/project.service";
import { projectControllerClass } from "../Controller/project.controller";

import { db } from "../../../prisma/db";

const router = Router();

const workspaceRepo = new workspaceRepoClass(
  db.orm.public.Workspace
);

const projectRepo = new projectRepoClass(
  db.orm.public.Project,
  workspaceRepo,
  db.orm.public.Page
);

const projectService = new projectServiceClass(
  projectRepo
);

const projectController = new projectControllerClass(
  projectService
);

// All project routes require authentication
router.use(authenticate);

// Create project
router.post(
  "/",
  validateBody(createProjectSchema),
  projectController.create
);

// Get all projects of a workspace (?workspaceId=)
router.get(
  "/",
  projectController.getByWorkspace
);

// Get project by slug within a workspace.
// Declared before "/:projectId" so "workspace" isn't parsed as an id.
router.get(
  "/workspace/:workspaceId/slug/:slug",
  projectController.getBySlug
);

// Get project details (project + workspace + pages)
router.get(
  "/:projectId/details",
  projectController.getDetails
);

// Get project by ID
router.get(
  "/:projectId",
  projectController.getById
);

// Update project
router.patch(
  "/:projectId",
  validateBody(updateProjectSchema),
  projectController.update
);

// Delete project
router.delete(
  "/:projectId",
  projectController.delete
);

export default router;
