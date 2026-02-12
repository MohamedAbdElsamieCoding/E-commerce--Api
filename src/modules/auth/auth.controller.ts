import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../config/db.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { loginSchema, registerSchema } from "./auth-schema.js";
import { AppError } from "../../utils/app-error.js";
import { httpStatusText } from "../../utils/http-status-text.js";
import {
  comparePassword,
  generateAccessToken,
  verifyToken,
  JWT_REFRESH_SECRET,
  generateResetToken,
} from "../../utils/auth.js";
import { generateRefreshToken } from "../../utils/auth.js";
import { sendResponse } from "../../utils/response.js";
import { setRefreshToCookies as setRefreshToCookies } from "../../utils/set-cookies.js";
import { JwtPayload } from "../../types/jwt-payload-type.js";
import { sendResetPasswordEmail } from "./auth.service.js";

export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const validateData = registerSchema.parse(req.body);
    const { firstName, lastName, userName, email, password } = validateData;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { userName }],
      },
    });

    if (existingUser) {
      const message =
        existingUser.email === email
          ? "Email is already registered"
          : "Username is already taken";
      return next(new AppError(message, httpStatusText.FAIL, 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        userName,
        email,
        password: hashedPassword,
      },
    });
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    setRefreshToCookies(res, refreshToken);
    sendResponse(res, 200, httpStatusText.SUCCESS, "Register successfully", {
      accessToken,
    });
  },
);

export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const validateData = loginSchema.parse(req.body);
    const { email, password } = validateData;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return next(
        new AppError("Invalid email or password", httpStatusText.FAIL, 400),
      );
    const isValidate = await comparePassword(password, user.password);
    if (!isValidate)
      return next(
        new AppError("Invalid email or password", httpStatusText.FAIL, 400),
      );
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    setRefreshToCookies(res, refreshToken);
    sendResponse(res, 200, httpStatusText.SUCCESS, "login successfully", {
      accessToken,
    });
  },
);

export const refreshToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken)
      return next(
        new AppError("Refresh token is required", httpStatusText.FAIL, 400),
      );

    let decoded: JwtPayload | null;

    decoded = verifyToken(refreshToken, JWT_REFRESH_SECRET) as JwtPayload;

    if (!decoded)
      return next(
        new AppError(
          "Invalid or expired refresh token",
          httpStatusText.FAIL,
          401,
        ),
      );

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, refreshToken: true },
    });

    if (!user || user.refreshToken !== refreshToken)
      return next(
        new AppError(
          "Token mismatch or user not found",
          httpStatusText.FAIL,
          403,
        ),
      );

    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    setRefreshToCookies(res, newRefreshToken);
    sendResponse(
      res,
      200,
      httpStatusText.SUCCESS,
      "Token refreshed successfully",
      {
        accessToken: newAccessToken,
      },
    );
  },
);

export const logout = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const decoded = verifyToken(
        refreshToken,
        JWT_REFRESH_SECRET,
      ) as JwtPayload;
      if (decoded) {
        await prisma.user.update({
          where: { id: decoded.id },
          data: { refreshToken: null },
        });
      }
    }
    res.clearCookie("refreshToken");
    sendResponse(res, 200, httpStatusText.SUCCESS, "Logged out successfully");
  },
);

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    if (!email)
      return next(new AppError("Email is required", httpStatusText.FAIL, 400));
    const user = await prisma.user.findUnique({ where: { email: email } });
    if (!user)
      return next(new AppError("User not found", httpStatusText.ERROR, 404));
    const resetToken = generateResetToken(user.id);
    await prisma.user.update({
      where: { email: user.email },
      data: { resetToken, resetTokenEx: new Date(Date.now() + 3600 * 1000) },
    });

    await sendResetPasswordEmail(email, resetToken);

    sendResponse(res, 200, httpStatusText.SUCCESS, "Reset link sent to email");
  },
);
