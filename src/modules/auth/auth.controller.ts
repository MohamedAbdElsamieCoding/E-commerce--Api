import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../config/db";
import { asyncHandler } from "../../middlewares/async-handler";
import { registerSchema } from "../../schemas/user-schema";
import { AppError } from "../../utils/app-error";
import { httpStatusText } from "../../utils/http-status-text";
import jwt from "jsonwebtoken";
import { generateToken } from "../../utils/auth";

export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const validateData = registerSchema.parse(req.body);
    const { firstName, lastName, userName, email, password } = validateData;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return next(
        new AppError("User already exists", httpStatusText.FAIL, 400),
      );
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

    const token = generateToken(user.id);
    res.status(201).json({
      status: httpStatusText.SUCCESS,
      message: "User created successfully",
      token: token,
    });
  },
);
