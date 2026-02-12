import { Request, Response, NextFunction } from "express";
import { AppError } from "../../utils/app-error.js";
import { httpStatusText } from "../../utils/http-status-text.js";
import { verifyToken } from "../../utils/auth.js";
import { prisma } from "../../config/db.js";
import { JwtPayload } from "../../types/jwt-payload-type.js";
import { Role } from "@prisma/client";

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

export const authorizeTo = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role)
      return next(
        new AppError("User role not found", httpStatusText.ERROR, 401),
      );
    const allowedRoles = roles.map((r) => r.toUpperCase());
    if (!allowedRoles.includes(req.user.role as Role))
      return next(new AppError("Not allowed", httpStatusText.FAIL, 403));
    next();
  };
};
