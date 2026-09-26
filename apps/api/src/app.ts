import cors from "cors";
import express from "express";
import { authRouter } from "./Modules/auth/Routes/auth.routes";
import projectRouter from "./Modules/Projects/Routes/project.routes";
import workspaceRouter from "./Modules/Workspace/Routes/workspace.routes"
import memberRouter from "./Modules/Workspace/Routes/member.routes";
import {
  invitationTokenRouter,
  workspaceInvitationRouter,
} from "./Modules/Workspace/Routes/invitation.routes";
import pageRouter from "./Modules/Pages/Routes/page.routes";
import blockRouter from "./Modules/Pages/Routes/block.routes";
import { apiSuccess } from "./Shared/apiResponse";
import { errorHandler, notFoundHandler } from "./Shared/errorMiddleware";
import cookie from 'cookie-parser'
export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: process.env["WEB_ORIGIN"] ?? "http://localhost:3000",
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookie())

  app.get("/health", (_req, res) => {
    return apiSuccess(res, { ok: true }, "API is healthy", 200);
  });

  app.use("/api/auth", authRouter);
  app.use('/api/workspaces',workspaceRouter)
  // Workspace collaboration (members, invitations, leave, transfer).
  // Served versioned as specified, with unversioned aliases preserved
  // for existing clients (same convention as pages/blocks).
  app.use("/api/workspaces", memberRouter);
  app.use("/api/v1/workspaces", memberRouter);
  app.use("/api/workspaces", workspaceInvitationRouter);
  app.use("/api/v1/workspaces", workspaceInvitationRouter);
  app.use("/api/invitations", invitationTokenRouter);
  app.use("/api/v1/invitations", invitationTokenRouter);
  app.use("/api/projects", projectRouter);
  // Page + Block system (versioned as specified; unversioned aliases preserved
  // for existing clients).
  app.use("/api/v1/pages", pageRouter);
  app.use("/api/pages", pageRouter);
  app.use("/api/v1/blocks", blockRouter);
  app.use("/api/blocks", blockRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
