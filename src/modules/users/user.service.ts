import { Prisma } from "@prisma/client";
import { Status } from "../../types/status-type";
import { AdminUpdateUserDTO } from "../../types/update-user-admin";
import { UpdatedUserDTO } from "../../types/updated-data-type";
import { AppError } from "../../utils/app-error";
import { httpStatusText } from "../../utils/http-status-text";
import {
  countUsers,
  findUserByEmailOrUsername,
  findUserById,
  findUserDetailsById,
  findUserProfileById,
  findUsers,
  softDeleteUserById,
  updateUser,
  updateUserById,
  updateUserPassword,
} from "./user.repository";
import { GetUserQueryDTO } from "../../types/get-user-queryDTO";
import { comparePassword, hashedPassword } from "../../utils/auth";

// User Management Service

export const getMeService = async (userId: string) => {
  if (!userId) throw new AppError("Unauthorized", httpStatusText.FAIL, 401);

  const user = await findUserProfileById(userId);

  if (!user) throw new AppError("User not found", httpStatusText.FAIL, 404);

  return user;
};

export const updateMeService = async (
  userId: string,
  updatedData: UpdatedUserDTO,
) => {
  if (!userId) throw new AppError("Unauthorized", httpStatusText.FAIL, 401);
  if (updatedData.email || updatedData.userName) {
    const existingUser = await findUserByEmailOrUsername(
      userId,
      updatedData.email,
      updatedData.userName,
    );
    if (existingUser) {
      if (existingUser.email === updatedData.email)
        throw new AppError("Email already exists", httpStatusText.FAIL, 400);

      if (existingUser.userName === updatedData.userName)
        throw new AppError("Username already exists", httpStatusText.FAIL, 400);
    }
  }
  return updateUser(userId, updatedData);
};

export const changePasswordService = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await findUserById(userId);
  if (!user) throw new AppError("User not found", httpStatusText.FAIL, 404);

  if (!user.isActive || user.deletedAt)
    throw new AppError("Account is deactivated", httpStatusText.FAIL, 403);

  const isMatched = await comparePassword(currentPassword, user.password);
  if (currentPassword === newPassword)
    throw new AppError(
      "New password must be different from current password",
      httpStatusText.FAIL,
      400,
    );
  const newHashedPassword = await hashedPassword(newPassword);
  await updateUserPassword(userId, newHashedPassword);
};

export const deleteMeService = async (userId: string) => {
  const user = await findUserById(userId);

  if (!user) throw new AppError("User not found", httpStatusText.FAIL, 404);

  if (user.deletedAt)
    throw new AppError("Account already deactivated", httpStatusText.FAIL, 400);

  await softDeleteUserById(userId);
};
// Admin Management Service
export const getAllUsersService = async (query: GetUserQueryDTO) => {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 10;
  const skip = (page - 1) * limit;

  const where: Prisma.userWhereInput = {};
  if (query.search) {
    where.OR = [
      {
        email: { contains: query.search, mode: "insensitive" },
        userName: { contains: query.search, mode: "insensitive" },
      },
    ];
  }
  if (query.status === "active") where.isActive = true;
  if (query.status === "deleted") where.isActive = false;

  const [users, totalUsers] = await Promise.all([
    findUsers(where, skip, limit),
    countUsers(where),
  ]);
  return {
    results: users.length,
    total: totalUsers,
    page,
    pages: Math.ceil(totalUsers / limit),
    data: users,
  };
};

export const getUserByIdService = async (id: string) => {
  const user = await findUserDetailsById(id);
  if (!user) throw new AppError("User not found", httpStatusText.FAIL, 404);

  return user;
};

export const updateUserService = async (
  id: string,
  body: AdminUpdateUserDTO,
) => {
  const existingUser = await findUserById(id);
  if (!existingUser)
    throw new AppError("User not found", httpStatusText.FAIL, 404);
  const { userName, firstName, lastName, isActive, role } = body;
  const data: UpdatedUserDTO = {};
  if (userName !== undefined) data.userName = userName;
  if (firstName !== undefined) data.firstName = firstName;
  if (lastName !== undefined) data.lastName = lastName;
  if (isActive !== undefined) data.isActive = isActive;
  if (role !== undefined) data.role = role;

  if (Object.keys(data).length === 0)
    throw new AppError(
      "No valid fields provided to update",
      httpStatusText.FAIL,
      400,
    );

  return updateUserById(id, data);
};
