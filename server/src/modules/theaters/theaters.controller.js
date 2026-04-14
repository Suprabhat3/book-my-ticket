import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccess } from "../../common/utils/api-response.js";
import * as theatersService from "./theaters.service.js";

export const listTheaters = asyncHandler(async (req, res) => {
  const query = req.validated?.query || {};
  const theaters = await theatersService.listTheaters({
    cityId: query.cityId,
    includeInactive: query.includeInactive === "true",
    search: query.search || "",
  });

  return sendSuccess(res, {
    message: "Theaters fetched successfully",
    data: theaters,
  });
});

export const createTheater = asyncHandler(async (req, res) => {
  const theater = await theatersService.createTheater(req.validated.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: "Theater created successfully",
    data: theater,
  });
});

export const updateTheater = asyncHandler(async (req, res) => {
  const theater = await theatersService.updateTheater(req.validated.params.id, req.validated.body);

  return sendSuccess(res, {
    message: "Theater updated successfully",
    data: theater,
  });
});

export const deleteTheater = asyncHandler(async (req, res) => {
  const theater = await theatersService.deactivateTheater(req.validated.params.id);

  return sendSuccess(res, {
    message: "Theater deactivated successfully",
    data: theater,
  });
});
