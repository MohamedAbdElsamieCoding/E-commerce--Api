import { Response } from "express";
import { httpStatusText } from "./http-status-text.js";

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  statusText: httpStatusText,
  message: string,
  data?: T,
) => {
  return res.status(statusCode).json({
    status: statusText,
    message,
    data,
  });
};
