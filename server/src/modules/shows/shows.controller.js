import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccess } from "../../common/utils/api-response.js";
import * as showsService from "./shows.service.js";

export const listShows = asyncHandler(async (req, res) => {
  const query = req.validated?.query || {};
  const shows = await showsService.listShows({
    movieId: query.movieId,
    theaterId: query.theaterId,
    screenId: query.screenId,
    status: query.status,
  });

  return sendSuccess(res, {
    message: "Shows fetched successfully",
    data: shows,
  });
});

export const listPublicShows = asyncHandler(async (req, res) => {
  const query = req.validated?.query || {};
  const shows = await showsService.listShows({
    movieId: query.movieId,
    theaterId: query.theaterId,
    screenId: query.screenId,
    status: query.status,
    publicOnly: true,
  });

  return sendSuccess(res, {
    message: "Shows fetched successfully",
    data: shows,
  });
});

export const getPublicShowSeatMap = asyncHandler(async (req, res) => {
  const show = await showsService.getPublicShowSeatMap(req.validated.params.id);

  return sendSuccess(res, {
    message: "Show seat map fetched successfully",
    data: show,
  });
});

export const createShow = asyncHandler(async (req, res) => {
  const show = await showsService.createShow(req.validated.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: "Show created successfully",
    data: show,
  });
});

export const updateShow = asyncHandler(async (req, res) => {
  const show = await showsService.updateShow(req.validated.params.id, req.validated.body);

  return sendSuccess(res, {
    message: "Show updated successfully",
    data: show,
  });
});

export const removeShow = asyncHandler(async (req, res) => {
  const show = await showsService.deleteShow(req.validated.params.id);

  return sendSuccess(res, {
    message: "Show cancelled successfully",
    data: show,
  });
});
