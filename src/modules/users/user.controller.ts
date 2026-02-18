import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../../middlewares/async-handler";
import { prisma } from "../../config/db";
import { sendResponse } from "../../utils/response";
import { httpStatusText } from "../../utils/http-status-text";
import { AppError } from "../../utils/app-error";
import { UpdatedUserDTO } from "../../types/updated-data-type";
import { updateMeSchema } from "./user.schema";

// User Management
export const getMe = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const id = req.user?.id;
    const user = await prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userName: true,
        role: true,
        createdAt: true,
      },
    });
    sendResponse(
      res,
      200,
      httpStatusText.SUCCESS,
      "User fetched successfully",
      { user },
    );
  },
);

export const updateMe = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.user?.id;
    const validateData = updateMeSchema.parse(req.body);
    const updatedData: UpdatedUserDTO = validateData;

    if (updatedData.email || updatedData.userName) {
      const existingUser = await prisma.user.findFirst({
        where: {
          NOT: { id: id },
          OR: [
            updatedData.email ? { email: updatedData.email } : {},
            updatedData.userName ? { userName: updatedData.userName } : {},
          ],
        },
      });
      if (existingUser) {
        if (existingUser.email === updatedData.email)
          return next(
            new AppError("Email already exists", httpStatusText.FAIL, 400),
          );
        if (existingUser.userName === updatedData.userName)
          return next(
            new AppError("Username already exists", httpStatusText.FAIL, 400),
          );
      }
    }

    await prisma.user.update({
      where: { id: id },
      data: updatedData,
    });

    sendResponse(res, 200, httpStatusText.SUCCESS, "Data updated successfully");
  },
);

export const changePassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {},
);

export const deleteMe = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {},
);
