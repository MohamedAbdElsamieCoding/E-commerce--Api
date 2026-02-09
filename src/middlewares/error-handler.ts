import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error.js";
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = (err as AppError).statusCode || 500;
  const statusText = (err as AppError).statusText || "error";
  console.log(
    `${req.user?.id || `no id`} ${err.message}  , ${req.method} , ${
      req.originalUrl
    }\n${err.stack}`,
  );
  res.status(statusCode).json({
    status: statusText,
    message: err.message || "Something went wrong",
  });
};
