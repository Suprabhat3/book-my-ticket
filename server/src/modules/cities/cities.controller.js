import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccess } from "../../common/utils/api-response.js";
import * as citiesService from "./cities.service.js";

export const listCities = asyncHandler(async (req, res) => {
  const query = req.validated?.query || {};
  const cities = await citiesService.listCities({
    includeInactive: query.includeInactive === "true",
    search: query.search || "",
  });

  return sendSuccess(res, {
    message: "Cities fetched successfully",
    data: cities,
  });
});

export const listPublicCities = asyncHandler(async (req, res) => {
  const query = req.validated?.query || {};
  const cities = await citiesService.listCities({
    includeInactive: false,
    search: query.search || "",
  });

  return sendSuccess(res, {
    message: "Cities fetched successfully",
    data: cities,
  });
});

export const createCity = asyncHandler(async (req, res) => {
  const city = await citiesService.createCity(req.validated.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: "City created successfully",
    data: city,
  });
});

export const updateCity = asyncHandler(async (req, res) => {
  const city = await citiesService.updateCity(req.validated.params.id, req.validated.body);

  return sendSuccess(res, {
    message: "City updated successfully",
    data: city,
  });
});

export const deleteCity = asyncHandler(async (req, res) => {
  const city = await citiesService.deactivateCity(req.validated.params.id);

  return sendSuccess(res, {
    message: "City deactivated successfully",
    data: city,
  });
});
