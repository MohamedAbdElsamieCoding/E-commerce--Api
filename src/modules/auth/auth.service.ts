import nodemailer from "nodemailer";
import {
  JWT_REFRESH_SECRET,
  JWT_RESET_SECRET,
  comparePassword,
  generateAccessToken,
  generatePasswordResetToken,
  generateRefreshToken,
  hashedPassword,
  verifyToken,
} from "../../utils/auth";
import { prisma } from "../../config/db";
import { httpStatusText } from "../../utils/http-status-text";
import { AppError } from "../../utils/app-error";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth-schema";
import { z } from "zod";
import { JwtPayload } from "../../types/jwt-payload-type";
import { redis } from "../../config/redis";
import crypto from "crypto";

type RegisterDTO = z.infer<typeof registerSchema>;
type LoginDTO = z.infer<typeof loginSchema>;
type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;

// Email Transporter Setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: `"Cartzy" <${process.env.SMTP_USER}> `,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.log("Email sending failed:", error);
    throw new Error("Failed to send email");
  }
}

export async function sendResetPasswordEmail(to: string, token: string) {
  const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  const html = `
    <p>Click the link below to reset your password:</p>
    <a href="${resetURL}">${resetURL}</a>
  `;
  await sendEmail(to, "Reset Your Password", html);
}

// Auth Services
export const registerService = async (data: RegisterDTO) => {
  const { firstName, lastName, userName, email, password } = data;

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
    throw new AppError(message, httpStatusText.FAIL, 400);
  }

  const hashPassword = await hashedPassword(password);
  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      userName,
      email,
      password: hashPassword,
    },
  });
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return { accessToken, refreshToken };
};

export const loginService = async (data: LoginDTO) => {
  const { email, password } = data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    throw new AppError("Invalid email or password", httpStatusText.FAIL, 400);
  const isValidate = await comparePassword(password, user.password);
  if (!isValidate)
    throw new AppError("Invalid email or password", httpStatusText.FAIL, 400);

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return { accessToken, refreshToken };
};

export const refreshTokenService = async (refreshToken: string) => {
  let decoded: JwtPayload | null;

  decoded = verifyToken(refreshToken, JWT_REFRESH_SECRET) as JwtPayload;

  if (!decoded)
    throw new AppError(
      "Invalid or expired refresh token",
      httpStatusText.FAIL,
      401,
    );

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, refreshToken: true },
  });

  if (!user || user.refreshToken !== refreshToken)
    throw new AppError(
      "Token mismatch or user not found",
      httpStatusText.FAIL,
      403,
    );

  const newAccessToken = generateAccessToken(user.id);
  const newRefreshToken = generateRefreshToken(user.id);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefreshToken },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logoutService = async (refreshToken: string) => {
  if (refreshToken) {
    const decoded = verifyToken(refreshToken, JWT_REFRESH_SECRET) as JwtPayload;
    if (decoded) {
      await prisma.user.update({
        where: { id: decoded.id },
        data: { refreshToken: null },
      });
    }
  }
};

export const forgotPasswordService = async (data: ForgotPasswordDTO) => {
  const { email } = data;
  if (!email) throw new AppError("Email is required", httpStatusText.FAIL, 400);

  const user = await prisma.user.findUnique({ where: { email: email } });
  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");

    await redis.set(`reset:${resetToken}`, user.id, { EX: 600 });

    const jwtToken = generatePasswordResetToken(resetToken);

    await sendResetPasswordEmail(email, jwtToken);
  }
};

export const resetPasswordService = async (
  token: string,
  data: ResetPasswordDTO,
) => {
  const { password } = data;
  const decoded = verifyToken(token as string, JWT_RESET_SECRET) as JwtPayload;
  const userId = await redis.get(`reset:${decoded.token}`);
  if (!userId)
    throw new AppError("Invalid or expired link", httpStatusText.FAIL, 400);

  const hashPassword = await hashedPassword(password);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashPassword },
  });

  await redis.del(`reset:${decoded.token}`);
};
