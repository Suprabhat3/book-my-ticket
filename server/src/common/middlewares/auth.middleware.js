import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AppError } from "../utils/app-error.js";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    req.user = payload;
    return next();
  } catch (error) {
    return next(new AppError("Invalid or expired access token", 401));
  }
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    req.user = payload;
  } catch {
    req.user = undefined;
  }

  return next();
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Unauthorized", 401));
  }

  if (!roles.includes(req.user.role)) {
    return next(new AppError("Forbidden", 403));
  }

  return next();
};
