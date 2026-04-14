import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccess } from "../../common/utils/api-response.js";
import * as moviesService from "./movies.service.js";

export const listMovies = asyncHandler(async (req, res) => {
  const query = req.validated?.query || {};
  const movies = await moviesService.listMovies({
    includeInactive: query.includeInactive === "true",
    search: query.search || "",
    language: query.language || "",
  });

  return sendSuccess(res, {
    message: "Movies fetched successfully",
    data: movies,
  });
});

export const createMovie = asyncHandler(async (req, res) => {
  const movie = await moviesService.createMovie(req.validated.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: "Movie created successfully",
    data: movie,
  });
});

export const updateMovie = asyncHandler(async (req, res) => {
  const movie = await moviesService.updateMovie(req.validated.params.id, req.validated.body);

  return sendSuccess(res, {
    message: "Movie updated successfully",
    data: movie,
  });
});

export const deleteMovie = asyncHandler(async (req, res) => {
  const movie = await moviesService.deactivateMovie(req.validated.params.id);

  return sendSuccess(res, {
    message: "Movie deactivated successfully",
    data: movie,
  });
});
