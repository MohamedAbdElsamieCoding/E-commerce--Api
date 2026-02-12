import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../types/jwt-payload-type.js";

export const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "fallback_secret";
export const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "fallback_secret";

interface JwtError extends Error {
  name: "TokenExpiredError" | "JsonWebTokenError";
}

/**
 *
 * @param password
 * @returns
 */
export const hashedPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 *
 * @param password
 * @param hashedPassword
 * @returns
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 *
 * @param userId
 * @returns
 */
export const generateAccessToken = (userId: string) => {
  return jwt.sign({ id: userId }, JWT_ACCESS_SECRET, { expiresIn: "7d" });
};

/**
 *
 * @param userId
 * @returns
 */
export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ id: userId }, JWT_REFRESH_SECRET, { expiresIn: "15m" });
};

/**
 *
 * @param userId
 * @returns
 */
export const generateResetToken = (userId: string) => {
  return jwt.sign({ id: userId }, JWT_ACCESS_SECRET, { expiresIn: "1h" });
};

/**
 *
 * @param token
 * @returns
 */
export const verifyToken = (
  token: string,
  secret: string = JWT_ACCESS_SECRET,
): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded as JwtPayload;
  } catch (err) {
    const error = err as JwtError;
    if (error.name === "TokenExpiredError") {
      console.log("Token expired");
      return null;
    }

    if (error.name === "JsonWebTokenError") {
      console.log("Invalid token");
      return null;
    }

    return null;
  }
};
