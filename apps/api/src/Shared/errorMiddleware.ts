import type { NextFunction, Request, Response } from "express";
import { apiError } from "./apiResponse";
import { HttpError } from "./httpError";
import {
  WorkspaceAccessDeniedError,
  WorkspaceNotFoundError,
  WorkspaceSlugAlreadyExistsError,
} from "../Modules/Workspace/utils/workspace.errors";

const isUniqueViolation = (err: unknown) => {
  const e = err as { code?: string; sqlState?: string; constraint?: string };
  return e?.code === "23505" || e?.sqlState === "23505";
};

export const errorHandler = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  if (err instanceof HttpError) {
    return apiError(res, err.message, err.statusCode);
  }

  if (err instanceof WorkspaceNotFoundError) {
    return apiError(res, err.message, 404);
  }

  if (err instanceof WorkspaceAccessDeniedError) {
    return apiError(res, err.message, 403);
  }

  if (err instanceof WorkspaceSlugAlreadyExistsError) {
    return apiError(res, err.message, 409);
  }

  if (isUniqueViolation(err)) {
    return apiError(res, "Resource already exists", 409);
  }

  console.error(err);
  return apiError(res, "Internal server error", 500);
};

export const notFoundHandler = (_req: Request, res: Response) => {
  return apiError(res, "Not found", 404);
};
