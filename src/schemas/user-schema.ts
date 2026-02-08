import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(2, "Must be at least 2 character").nonempty(),
  lastName: z.string().min(2, "Must be at least 2 character").nonempty(),
  userName: z.string().nonempty(),
  email: z.email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 character"),
});
