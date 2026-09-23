import type { Response } from "express";

export const apiSuccess = <T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const apiError = (
  res: Response,
  message = "Something went wrong",
  statusCode = 500,
  errors?: unknown
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors !== undefined && { errors }),
  });
};
