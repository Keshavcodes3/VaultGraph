import { Router } from "express";
import {
  createBlockSchema,
  createPageSchema,
  duplicatePageSchema,
  moveBlockSchema,
  movePageSchema,
  reorderBlocksSchema,
  reorderPagesSchema,
  updateBlockSchema,
  updatePageSchema,
} from "@vaultgraph/shared/pages-types";
import { validateBody } from "../../../Shared/validate";
import { authenticate } from "../../../Middleware/auth.middleware";
import { db } from "../../../prisma/db";
import { AuthRepository } from "../../auth/repositary/auth.repo";
import { workspaceRepoClass } from "../../Workspace/Repostiary/workspace.repositary";
import { projectRepoClass } from "../../Projects/Repositary/project.repo";
import { pageRepositaryClass } from "../Repositary/pages.repo";
import { blockRepositoryClass } from "../Repositary/blocks.repo";
import { pageServiceClass } from "../Services/page.service";
import { blockServiceClass } from "../Services/block.service";
import { pageControllerClass } from "../Controllers/page.controller";
import { blockControllerClass } from "../Controllers/block.controller";

const router = Router();

// Reuse existing Workspace / Project / Auth modules (no duplicate auth logic).
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

const pageService = new pageServiceClass(
  pageRepo,
  blockRepo,
  workspaceRepo,
  projectRepo
);
const blockService = new blockServiceClass(
  blockRepo,
  pageRepo,
  workspaceRepo
);

const pageController = new pageControllerClass(pageService);
const blockController = new blockControllerClass(blockService);

// All page routes require authentication.
router.use(authenticate);

// Create page
router.post("/", validateBody(createPageSchema), pageController.create);

// List pages (?workspaceId=&projectId=&parentId=&archived=&favorites=)
// Normal queries exclude archived; pass archived=true to include them.
router.get("/", pageController.list);

// Page tree (nested hierarchy, ordered siblings)
// Declared before "/:pageId" so "tree" isn't parsed as an id.
router.get("/tree", pageController.tree);

// Reorder siblings (persistent ordering, validated sibling scope)
// Declared before "/:pageId" so "reorder" isn't parsed as an id.
router.post(
  "/reorder",
  validateBody(reorderPagesSchema),
  pageController.reorder
);

// Get page with blocks + hierarchy context ({ page, blocks, ancestors, children })
router.get("/:pageId", pageController.getById);

// Update page
router.patch(
  "/:pageId",
  validateBody(updatePageSchema),
  pageController.update
);

// Move page (new parent / root / reorder among siblings, atomic validation)
router.post(
  "/:pageId/move",
  validateBody(movePageSchema),
  pageController.move
);

// Duplicate page (new ids, copied blocks + ordering + recursive children)
router.post(
  "/:pageId/duplicate",
  validateBody(duplicatePageSchema),
  pageController.duplicate
);

// Favorite / unfavorite (persisted flag)
router.post("/:pageId/favorite", pageController.favorite);
router.delete("/:pageId/favorite", pageController.unfavorite);

// Archive / restore (soft, retains blocks + content)
router.post("/:pageId/archive", pageController.archive);
router.post("/:pageId/restore", pageController.restore);

// Delete page (children + blocks cascade, never orphans)
router.delete("/:pageId", pageController.delete);

// Blocks nested under a page
router.post(
  "/:pageId/blocks",
  validateBody(createBlockSchema),
  blockController.create
);
router.get("/:pageId/blocks", blockController.list);
router.post(
  "/:pageId/blocks/reorder",
  validateBody(reorderBlocksSchema),
  blockController.reorder
);

// Move a nested block (kept here for page-scoped symmetry)
router.post(
  "/:pageId/blocks/:blockId/move",
  validateBody(moveBlockSchema),
  blockController.move
);

export default router;
