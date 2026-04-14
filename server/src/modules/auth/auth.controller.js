import { env } from "../../config/env.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccess } from "../../common/utils/api-response.js";
import * as authService from "./auth.service.js";

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax",
  path: "/api/v1/auth",
};

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.validated.body);
  return sendSuccess(res, {
    statusCode: 201,
    message: "User registered successfully",
    data: user,
  });
});

export const registerAdmin = asyncHandler(async (req, res) => {
  const user = await authService.registerAdmin(req.validated.body);
  return sendSuccess(res, {
    statusCode: 201,
    message: "Admin registered successfully",
    data: user,
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.validated.body);
  res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);

  return sendSuccess(res, {
    message: "Login successful",
    data: { accessToken: result.accessToken, user: result.user },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;
  const tokens = await authService.refresh(incomingRefreshToken);
  res.cookie("refreshToken", tokens.refreshToken, refreshCookieOptions);

  return sendSuccess(res, {
    message: "Token refreshed",
    data: { accessToken: tokens.accessToken },
  });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.sub);
  res.clearCookie("refreshToken", refreshCookieOptions);

  return sendSuccess(res, {
    message: "Logout successful",
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.sub);
  return sendSuccess(res, {
    message: "Current user fetched successfully",
    data: user,
  });
});
