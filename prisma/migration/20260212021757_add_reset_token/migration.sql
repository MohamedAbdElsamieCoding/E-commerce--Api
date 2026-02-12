/*
  Warnings:

  - The `role` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('USER', 'ADMIN', 'MERCHANT');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenEx" TIMESTAMP(3),
DROP COLUMN "role",
ADD COLUMN     "role" "Roles" NOT NULL DEFAULT 'USER';

-- DropEnum
DROP TYPE "Role";
