import { Request, Response, NextFunction } from "express";
import { AppError } from "../../utils/app-error.js";
import { httpStatusText } from "../../utils/http-status-text.js";
import { verifyToken } from "../../utils/auth.js";
import { prisma } from "../../config/db.js";
import { JwtPayload } from "../../types/jwt-payload-type.js";

export const protect = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeaders = req.headers.authorization;
  if (!authHeaders || !authHeaders.startsWith("Bearer"))
    return next(new AppError("Not authorized", httpStatusText.FAIL, 403));

  const token: string = authHeaders.split(" ")[1];
  const decoded = verifyToken(token) as JwtPayload;
  if (!decoded)
    return next(new AppError("Invalid Token", httpStatusText.FAIL, 401));

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });
  if (!user)
    return next(
      new AppError("User no longer exists", httpStatusText.FAIL, 401),
    );

  req.user = user;
  next();
};

import { Roles } from "@prisma/client";

export const authorizeTo = (...roles: Roles[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};
