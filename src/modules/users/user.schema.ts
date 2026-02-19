import { z } from "zod";

export const updateMeSchema = z
  .object({
    firstName: z.string().min(2, "Must be at least 2 character"),
    lastName: z.string().min(2, "Must be at least 2 character"),
    userName: z.string(),
    email: z.email("Invalid email format"),
  })
  .partial();

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });
