import { Router } from "express";

import {
  transferOwnershipSchema,
  updateMemberRoleSchema,
} from "@repo/shared/workspace-types";
import { validateBody } from "../../../Shared/validate";
import { authenticate } from "../../../Middleware/auth.middleware";

import { workspaceRepoClass } from "../Repostiary/workspace.repositary";
import { memberRepoClass } from "../Repostiary/member.repositary";
import { memberServiceClass } from "../service/member.service";
import { memberControllerClass } from "../Controller/member.controller";

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

const memberService = new memberServiceClass(
  memberRepo,
  workspaceRepo,
  authRepository
);

const memberController = new memberControllerClass(
  memberService
);

// All member routes require authentication
router.use(authenticate);

// List workspace members
router.get(
  "/:workspaceId/members",
  memberController.list
);

// Change a member's role
router.patch(
  "/:workspaceId/members/:memberId",
  validateBody(updateMemberRoleSchema),
  memberController.changeRole
);

// Remove a member
router.delete(
  "/:workspaceId/members/:memberId",
  memberController.remove
);

// Leave a workspace
router.post(
  "/:workspaceId/leave",
  memberController.leave
);

// Transfer workspace ownership
router.post(
  "/:workspaceId/transfer-ownership",
  validateBody(transferOwnershipSchema),
  memberController.transferOwnership
);

export default router;
