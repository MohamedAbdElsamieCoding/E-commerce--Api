import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../../middlewares/async-handler";
import { prisma } from "../../config/db";
import { sendResponse } from "../../utils/response";
import { httpStatusText } from "../../utils/http-status-text";
import { AppError } from "../../utils/app-error";
import { UpdatedUserDTO } from "../../types/updated-data-type";
import { changePasswordSchema, updateMeSchema } from "./user.schema";
import { comparePassword, hashedPassword } from "../../utils/auth";
import { Status } from "../../types/status-type";
import { AdminUpdateUserDTO } from "../../types/update-user-admin";
import {
  getAllUsersService,
  getUserByIdService,
  updateUserService,
} from "./user.service";
import { GetUserQueryDTO } from "../../types/get-user-queryDTO";

// User Management
export const getMe = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user?.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
    const userId = req.user?.id;
    const validateData = updateMeSchema.parse(req.body);
    const updatedData: UpdatedUserDTO = validateData;

    if (updatedData.email || updatedData.userName) {
      const existingUser = await prisma.user.findFirst({
        where: {
          NOT: { id: userId },
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
      where: { id: userId },
      data: updatedData,
    });

    sendResponse(res, 200, httpStatusText.SUCCESS, "Data updated successfully");
  },
);

export const changePassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const validateData = changePasswordSchema.parse(req.body);
    const { currentPassword, newPassword } = validateData;
    const userId = req.user?.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user)
      return next(new AppError("User not found", httpStatusText.FAIL, 404));
    const validatePassword = await comparePassword(
      currentPassword,
      user.password,
    );
    if (!validatePassword)
      return next(
        new AppError("Password is incorrect", httpStatusText.FAIL, 400),
      );

    const newHashedPassword = await hashedPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: newHashedPassword },
    });
    sendResponse(
      res,
      200,
      httpStatusText.SUCCESS,
      "Password changed successfully",
    );
  },
);

export const deleteMe = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user?.id;
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false, deletedAt: new Date() },
    });
    sendResponse(
      res,
      204,
      httpStatusText.SUCCESS,
      "Account deactivated successfully",
    );
  },
);

// Admin Management
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const query: GetUserQueryDTO = {
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 10,
    search: req.query.search as string | undefined,
    status: req.query.status as Status | undefined,
  };

  const result = await getAllUsersService(query);

  sendResponse(
    res,
    200,
    httpStatusText.SUCCESS,
    "Users fetched successfully",
    result,
  );
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { userId: id } = req.params;
  if (!id) throw new AppError("User id is required", httpStatusText.FAIL, 400);

  const user = await getUserByIdService(id as string);

  sendResponse(res, 200, httpStatusText.SUCCESS, "User fetched successfully", {
    data: user,
  });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId: id } = req.params;
  if (!id) new AppError("User id is required", httpStatusText.FAIL, 400);

  const updatedUser = await updateUserService(
    id as string,
    req.body as AdminUpdateUserDTO,
  );

  sendResponse(res, 200, httpStatusText.SUCCESS, "User updated successfully", {
    data: updatedUser,
  });
});
