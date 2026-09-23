import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { apiError } from "./apiResponse";

export const validateBody = <T>(schema: ZodType<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return apiError(res, "Validation failed", 400, result.error.flatten());
    }
    req.body = result.data;
    next();
  };
};
