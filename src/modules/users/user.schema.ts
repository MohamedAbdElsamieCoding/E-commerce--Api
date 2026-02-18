import { z } from "zod";

export const updateMeSchema = z
  .object({
    firstName: z.string().min(2, "Must be at least 2 character"),
    lastName: z.string().min(2, "Must be at least 2 character"),
    userName: z.string(),
    email: z.email("Invalid email format"),
  })
  .partial();
