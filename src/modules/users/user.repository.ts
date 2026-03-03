import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db";
import { UpdatedUserDTO } from "../../types/updated-data-type";

// User Repository

export const findUserProfileById = (id: string) => {
  return prisma.user.findUnique({
    where: { id },
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
};

export const findUserByEmailOrUsername = (
  userId: string,
  email?: string,
  userName?: string,
) => {
  return prisma.user.findFirst({
    where: {
      NOT: { id: userId },
      OR: [email ? { email } : {}, userName ? { userName } : {}],
    },
  });
};

export const updateUser = (id: string, data: UpdatedUserDTO) => {
  return prisma.user.update({
    where: { id },
    data,
  });
};

export const updateUserPassword = (id: string, password: string) => {
  return prisma.user.update({
    where: { id },
    data: { password },
  });
};

export const softDeleteUserById = (id: string) => {
  return prisma.user.update({
    where: { id },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });
};

// Admin Repository
export const findUserById = (id: string) => {
  return prisma.user.findUnique({ where: { id } });
};

export const updateUserById = (id: string, data: UpdatedUserDTO) => {
  return prisma.user.update({
    where: { id: id },
    data: { ...data },
    select: {
      id: true,
      userName: true,
      firstName: true,
      lastName: true,
      email: true,
      isActive: true,
      updatedAt: true,
    },
  });
};

export const findUserDetailsById = (id: string) => {
  return prisma.user.findUnique({
    where: { id: id },
    select: {
      id: true,
      email: true,
      userName: true,
      firstName: true,
      lastName: true,
      isActive: true,
      deletedAt: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const findUsers = (
  where: Prisma.UserWhereInput,
  skip: number,
  take: number,
) => {
  return prisma.user.findMany({
    where,
    skip,
    take,
    select: {
      id: true,
      email: true,
      userName: true,
      firstName: true,
      lastName: true,
      isActive: true,
      deletedAt: true,
    },
  });
};

export const countUsers = (where: Prisma.UserWhereInput) => {
  return prisma.user.count({ where });
};
