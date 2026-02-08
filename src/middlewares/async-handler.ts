import { RequestHandler } from "express";

export const asyncHandler =
  (asyncFn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(asyncFn(req, res, next)).catch(next);
  };
