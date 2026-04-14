import { prisma } from "../../db/prisma.js";
import { AppError } from "../../common/utils/app-error.js";
import { createImageKitUploadAuthParams } from "../../common/utils/imagekit-auth.js";

export function getImageKitUploadAuth() {
  return createImageKitUploadAuthParams();
}

export async function listMovies({ includeInactive = false, search = "", language = "" }) {
  return prisma.movie.findMany({
    where: {
      ...(includeInactive ? {} : { isActive: true }),
      ...(search
        ? {
            title: {
              contains: search,
              mode: "insensitive",
            },
          }
        : {}),
      ...(language
        ? {
            language: {
              equals: language,
              mode: "insensitive",
            },
          }
        : {}),
    },
    orderBy: [{ releaseDate: "desc" }, { title: "asc" }],
  });
}

export async function createMovie(payload) {
  const duplicate = await prisma.movie.findFirst({
    where: {
      title: {
        equals: payload.title.trim(),
        mode: "insensitive",
      },
      releaseDate: payload.releaseDate,
    },
  });

  if (duplicate) {
    throw new AppError("Movie with same title and release date already exists", 409);
  }

  return prisma.movie.create({
    data: {
      title: payload.title.trim(),
      description: payload.description.trim(),
      durationMinutes: payload.durationMinutes,
      language: payload.language.trim(),
      genre: payload.genre.trim(),
      releaseDate: payload.releaseDate,
      posterVerticalUrl: payload.posterVerticalUrl?.trim(),
      posterVerticalImagekitFileId: payload.posterVerticalImagekitFileId?.trim(),
      posterHorizontalUrl: payload.posterHorizontalUrl?.trim(),
      posterHorizontalImagekitFileId: payload.posterHorizontalImagekitFileId?.trim(),
      posterUrl: payload.posterVerticalUrl?.trim(),
      posterImagekitFileId: payload.posterVerticalImagekitFileId?.trim(),
      isActive: true,
    },
  });
}

export async function updateMovie(id, payload) {
  const movie = await prisma.movie.findUnique({ where: { id } });
  if (!movie) {
    throw new AppError("Movie not found", 404);
  }

  return prisma.movie.update({
    where: { id },
    data: {
      ...(payload.title !== undefined ? { title: payload.title.trim() } : {}),
      ...(payload.description !== undefined ? { description: payload.description.trim() } : {}),
      ...(payload.durationMinutes !== undefined ? { durationMinutes: payload.durationMinutes } : {}),
      ...(payload.language !== undefined ? { language: payload.language.trim() } : {}),
      ...(payload.genre !== undefined ? { genre: payload.genre.trim() } : {}),
      ...(payload.releaseDate !== undefined ? { releaseDate: payload.releaseDate } : {}),
      ...(payload.posterVerticalUrl !== undefined
        ? {
            posterVerticalUrl: payload.posterVerticalUrl.trim(),
            posterUrl: payload.posterVerticalUrl.trim(),
          }
        : {}),
      ...(payload.posterVerticalImagekitFileId !== undefined
        ? {
            posterVerticalImagekitFileId: payload.posterVerticalImagekitFileId.trim(),
            posterImagekitFileId: payload.posterVerticalImagekitFileId.trim(),
          }
        : {}),
      ...(payload.posterHorizontalUrl !== undefined
        ? { posterHorizontalUrl: payload.posterHorizontalUrl.trim() }
        : {}),
      ...(payload.posterHorizontalImagekitFileId !== undefined
        ? { posterHorizontalImagekitFileId: payload.posterHorizontalImagekitFileId.trim() }
        : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
    },
  });
}

export async function deactivateMovie(id) {
  const movie = await prisma.movie.findUnique({ where: { id } });
  if (!movie) {
    throw new AppError("Movie not found", 404);
  }

  if (!movie.isActive) {
    return movie;
  }

  return prisma.movie.update({
    where: { id },
    data: { isActive: false },
  });
}
