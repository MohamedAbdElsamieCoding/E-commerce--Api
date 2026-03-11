import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/db.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth-schema.js";
import { AppError } from "../../utils/app-error.js";
import { httpStatusText } from "../../utils/http-status-text.js";
import {
  comparePassword,
  generateAccessToken,
  verifyToken,
  JWT_REFRESH_SECRET,
  generatePasswordResetToken,
  JWT_RESET_SECRET,
  hashedPassword,
  generateRefreshToken,
} from "../../utils/auth.js";
import { sendResponse } from "../../utils/response.js";
import { setRefreshToCookies as setRefreshToCookies } from "../../utils/set-cookies.js";
import { JwtPayload } from "../../types/jwt-payload-type.js";
import {
  forgotPasswordService,
  loginService,
  logoutService,
  refreshTokenService,
  registerService,
  resetPasswordService,
  sendResetPasswordEmail,
} from "./auth.service.js";
import { redis } from "../../config/redis.js";
import crypto from "crypto";

export const register = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const validateData = registerSchema.parse(req.body);
    const { refreshToken, accessToken } = await registerService(validateData);

    setRefreshToCookies(res, refreshToken);
    sendResponse(res, 200, httpStatusText.SUCCESS, "Register successfully", {
      accessToken,
    });
  },
);

export const login = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const validateData = loginSchema.parse(req.body);

    const { accessToken, refreshToken } = await loginService(validateData);

    setRefreshToCookies(res, refreshToken);
    sendResponse(res, 200, httpStatusText.SUCCESS, "login successfully", {
      accessToken,
    });
  },
);

export const refreshToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const oldRefreshToken = req.cookies?.refreshToken;
    if (!oldRefreshToken)
      return next(
        new AppError("Refresh token is required", httpStatusText.FAIL, 400),
      );

    const { accessToken, refreshToken: newRefreshToken } =
      await refreshTokenService(oldRefreshToken);

    setRefreshToCookies(res, newRefreshToken);
    sendResponse(
      res,
      200,
      httpStatusText.SUCCESS,
      "Token refreshed successfully",
      {
        accessToken: accessToken,
      },
    );
  },
);

export const logout = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const refreshToken = req.cookies?.refreshToken;
    await logoutService(refreshToken);

    res.clearCookie("refreshToken");
    sendResponse(res, 200, httpStatusText.SUCCESS, "Logged out successfully");
  },
);

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const validateData = forgotPasswordSchema.parse(req.body);

    await forgotPasswordService(validateData);

    sendResponse(res, 200, httpStatusText.SUCCESS, "Reset link sent to email");
  },
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const validateData = resetPasswordSchema.parse(req.body);
    const token = req.params.token as string;

    await resetPasswordService(token, validateData);

    sendResponse(
      res,
      200,
      httpStatusText.SUCCESS,
      "Password updated successfully",
    );
  },
);
