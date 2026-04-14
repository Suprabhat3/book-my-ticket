import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccess } from "../../common/utils/api-response.js";
import * as screensService from "./screens.service.js";

export const listScreens = asyncHandler(async (req, res) => {
  const query = req.validated?.query || {};
  const screens = await screensService.listScreens({
    theaterId: query.theaterId,
    includeInactive: query.includeInactive === "true",
  });

  return sendSuccess(res, {
    message: "Screens fetched successfully",
    data: screens,
  });
});

export const createScreen = asyncHandler(async (req, res) => {
  const screen = await screensService.createScreen(req.validated.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: "Screen created successfully",
    data: screen,
  });
});

export const updateScreen = asyncHandler(async (req, res) => {
  const screen = await screensService.updateScreen(req.validated.params.id, req.validated.body);

  return sendSuccess(res, {
    message: "Screen updated successfully",
    data: screen,
  });
});

export const deleteScreen = asyncHandler(async (req, res) => {
  const screen = await screensService.deactivateScreen(req.validated.params.id);

  return sendSuccess(res, {
    message: "Screen deactivated successfully",
    data: screen,
  });
});
