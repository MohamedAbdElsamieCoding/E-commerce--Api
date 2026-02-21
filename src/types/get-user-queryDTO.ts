import { Status } from "./status-type";

export interface GetUserQueryDTO {
  page: number;
  limit: number;
  search?: string;
  status?: Status;
}
