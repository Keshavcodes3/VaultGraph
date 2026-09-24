import cors from "cors";
import express from "express";
import { authRouter } from "./Modules/auth/Routes/auth.routes";
import projectRouter from "./Modules/Projects/Routes/project.routes";
import workspaceRouter from "./Modules/Workspace/Routes/workspace.routes"
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
  app.use("/api/projects", projectRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
