import { Router } from "express";
import {
  moveBlockSchema,
  updateBlockSchema,
} from "@vaultgraph/shared/pages-types";
import { validateBody } from "../../../Shared/validate";
import { authenticate } from "../../../Middleware/auth.middleware";
import { db } from "../../../prisma/db";
import { AuthRepository } from "../../auth/repositary/auth.repo";
import { workspaceRepoClass } from "../../Workspace/Repostiary/workspace.repositary";
import { projectRepoClass } from "../../Projects/Repositary/project.repo";
import { pageRepositaryClass } from "../Repositary/pages.repo";
import { blockRepositoryClass } from "../Repositary/blocks.repo";
import { blockServiceClass } from "../Services/block.service";
import { blockControllerClass } from "../Controllers/block.controller";

const router = Router();

const authRepo = new AuthRepository(db);
const workspaceRepo = new workspaceRepoClass(db.orm.public.Workspace);
const projectRepo = new projectRepoClass(
  db.orm.public.Project,
  workspaceRepo,
  db.orm.public.Page
);
const pageRepo = new pageRepositaryClass(
  authRepo,
  projectRepo,
  workspaceRepo,
  db.orm.public.Page
);
const blockRepo = new blockRepositoryClass(db.orm.public.Block);
const blockService = new blockServiceClass(
  blockRepo,
  pageRepo,
  workspaceRepo
);
const blockController = new blockControllerClass(blockService);

// All block routes require authentication.
router.use(authenticate);

// Get single block
router.get("/:blockId", blockController.getById);

// Update block (type / content / parent / position)
router.patch(
  "/:blockId",
  validateBody(updateBlockSchema),
  blockController.update
);

// Move block (new parent within the same page + optional position)
router.post(
  "/:blockId/move",
  validateBody(moveBlockSchema),
  blockController.move
);

// Delete block (nested children cascade)
router.delete("/:blockId", blockController.delete);

export default router;
