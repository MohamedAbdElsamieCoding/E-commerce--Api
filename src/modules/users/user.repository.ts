import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db";
import { UpdatedUserDTO } from "../../types/updated-data-type";

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
  where: Prisma.userWhereInput,
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
export const countUsers = (where: Prisma.userWhereInput) => {
  return prisma.user.count({ where });
};
