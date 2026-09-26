import { Router } from "express";

import { createInvitationSchema } from "@repo/shared/workspace-types";
import { validateBody } from "../../../Shared/validate";
import { authenticate } from "../../../Middleware/auth.middleware";
import {
  invitationCreateLimiter,
  invitationResendLimiter,
  invitationTokenLimiter,
} from "../../../Shared/rateLimit";

import { workspaceRepoClass } from "../Repostiary/workspace.repositary";
import { memberRepoClass } from "../Repostiary/member.repositary";
import { invitationRepoClass } from "../Repostiary/invitation.repositary";
import { invitationServiceClass } from "../service/invitation.service";
import { invitationControllerClass } from "../Controller/invitation.controller";

import { authRepository } from "../../auth/repositary/auth.repo";
import { db } from "../../../prisma/db";

const workspaceRepo = new workspaceRepoClass(
  db.orm.public.Workspace
);

const memberRepo = new memberRepoClass(
  db.orm.public.Member,
  db.orm.public.User
);

const invitationRepo = new invitationRepoClass(
  db.orm.public.Invite
);

const invitationService = new invitationServiceClass(
  invitationRepo,
  memberRepo,
  workspaceRepo,
  authRepository
);

const invitationController = new invitationControllerClass(
  invitationService
);

// Workspace-scoped invitation routes (mounted under /api[/v1]/workspaces).
export const workspaceInvitationRouter = Router();

workspaceInvitationRouter.use(authenticate);

// List invitations (?status=)
workspaceInvitationRouter.get(
  "/:workspaceId/invitations",
  invitationController.list
);

// Create invitation
workspaceInvitationRouter.post(
  "/:workspaceId/invitations",
  invitationCreateLimiter,
  validateBody(createInvitationSchema),
  invitationController.create
);

// Resend invitation
workspaceInvitationRouter.post(
  "/:workspaceId/invitations/:invitationId/resend",
  invitationResendLimiter,
  invitationController.resend
);

// Revoke invitation
workspaceInvitationRouter.delete(
  "/:workspaceId/invitations/:invitationId",
  invitationController.revoke
);

// Token-scoped invitation routes (mounted under /api[/v1]/invitations).
// Details stay public so guests can preview an invitation before
// signing in; accept/reject require authentication.
export const invitationTokenRouter = Router();

invitationTokenRouter.get(
  "/:token",
  invitationTokenLimiter,
  invitationController.details
);

invitationTokenRouter.post(
  "/:token/accept",
  invitationTokenLimiter,
  authenticate,
  invitationController.accept
);

invitationTokenRouter.post(
  "/:token/reject",
  invitationTokenLimiter,
  authenticate,
  invitationController.reject
);
