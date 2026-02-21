import { Prisma } from "@prisma/client";
import { Status } from "../../types/status-type";
import { AdminUpdateUserDTO } from "../../types/update-user-admin";
import { UpdatedUserDTO } from "../../types/updated-data-type";
import { AppError } from "../../utils/app-error";
import { httpStatusText } from "../../utils/http-status-text";
import {
  countUsers,
  findUserById,
  findUserDetailsById,
  findUsers,
  updateUserById,
} from "./user.repository";
import { GetUserQueryDTO } from "../../types/get-user-queryDTO";

// User Management Service

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
