import { Role } from "@prisma/client";

export interface AdminUpdateUserDTO {
  firstName?: string;
  lastName?: string;
  userName?: string;
  role?: Role;
  isActive?: boolean;
}
