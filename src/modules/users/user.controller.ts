import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../../middlewares/async-handler";
import { sendResponse } from "../../utils/response";
import { httpStatusText } from "../../utils/http-status-text";
import { AppError } from "../../utils/app-error";
import { changePasswordSchema, updateMeSchema } from "./user.schema";
import { Status } from "../../types/status-type";
import { AdminUpdateUserDTO } from "../../types/update-user-admin";
import {
  changePasswordService,
  deleteMeService,
  getAllUsersService,
  getMeService,
  getUserByIdService,
  updateMeService,
  updateUserService,
} from "./user.service";
import { GetUserQueryDTO } from "../../types/get-user-queryDTO";

// User Management
export const getMe = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user?.id;
    const user = await getMeService(userId as string);
    // Need Cashing here
    sendResponse(
      res,
      200,
      httpStatusText.SUCCESS,
      "User fetched successfully",
      { user },
    );
  },
);

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError("Unauthorized", httpStatusText.FAIL, 401);

  const validateData = updateMeSchema.parse(req.body);
  await updateMeService(userId, validateData);

  sendResponse(res, 200, httpStatusText.SUCCESS, "Data updated successfully");
});

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const validateData = changePasswordSchema.parse(req.body);
    const { currentPassword, newPassword } = validateData;

    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", httpStatusText.FAIL, 401);

    await changePasswordService(userId, currentPassword, newPassword);

    sendResponse(
      res,
      200,
      httpStatusText.SUCCESS,
      "Password changed successfully",
    );
  },
);

export const deleteMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError("Unauthorized", httpStatusText.FAIL, 401);

  await deleteMeService(userId);

  sendResponse(
    res,
    200,
    httpStatusText.SUCCESS,
    "Account deactivated successfully",
  );
});

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
  if (!id) throw new AppError("User id is required", httpStatusText.FAIL, 400);

  const updatedUser = await updateUserService(
    id as string,
    req.body as AdminUpdateUserDTO,
  );

  sendResponse(res, 200, httpStatusText.SUCCESS, "User updated successfully", {
    data: updatedUser,
  });
});
