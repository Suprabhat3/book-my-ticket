import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../common/utils/app-error.js";

function buildTokenPayload(user) {
  return {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
}

function signAccessToken(user) {
  return jwt.sign(buildTokenPayload(user), env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn,
  });
}

function signRefreshToken(user) {
  return jwt.sign(buildTokenPayload(user), env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  });
}

export async function registerUser(payload) {
  const exists = await prisma.user.findUnique({ where: { email: payload.email } });
  if (exists) {
    throw new AppError("Email already registered", 409);
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      passwordHash,
      role: "USER",
    },
  });

  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function registerAdmin(payload) {
  if (!env.adminRegistrationKey || payload.adminKey !== env.adminRegistrationKey) {
    throw new AppError("Invalid admin registration key", 401);
  }

  const exists = await prisma.user.findUnique({ where: { email: payload.email } });
  if (exists) {
    throw new AppError("Email already registered", 409);
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      passwordHash,
      role: "ADMIN",
    },
  });

  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function login(payload) {
  const user = await prisma.user.findUnique({ where: { email: payload.email } });
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isValid = await bcrypt.compare(payload.password, user.passwordHash);
  if (!isValid) {
    throw new AppError("Invalid credentials", 401);
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

export async function refresh(refreshToken) {
  if (!refreshToken) {
    throw new AppError("Refresh token is required", 401);
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
  } catch (error) {
    throw new AppError("Invalid refresh token", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError("Refresh token not recognized", 401);
  }

  const accessToken = signAccessToken(user);
  const nextRefreshToken = signRefreshToken(user);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: nextRefreshToken },
  });

  return { accessToken, refreshToken: nextRefreshToken };
}

export async function logout(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
}

export async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}
