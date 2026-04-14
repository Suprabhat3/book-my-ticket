import { prisma } from "../../db/prisma.js";
import { AppError } from "../../common/utils/app-error.js";

export async function listShows({ movieId, theaterId, screenId, status }) {
  return prisma.show.findMany({
    where: {
      ...(movieId ? { movieId } : {}),
      ...(theaterId ? { theaterId } : {}),
      ...(screenId ? { screenId } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      movie: { select: { id: true, title: true } },
      theater: { select: { id: true, name: true, cityId: true } },
      screen: { select: { id: true, name: true, screenType: true } },
    },
    orderBy: { startTime: "asc" },
  });
}

export async function createShow(payload) {
  const [movie, theater, screen] = await Promise.all([
    prisma.movie.findUnique({ where: { id: payload.movieId } }),
    prisma.theater.findUnique({ where: { id: payload.theaterId } }),
    prisma.screen.findUnique({ where: { id: payload.screenId } }),
  ]);

  if (!movie || !movie.isActive) {
    throw new AppError("Movie not found or inactive", 400);
  }
  if (!theater || !theater.isActive) {
    throw new AppError("Theater not found or inactive", 400);
  }
  if (!screen || !screen.isActive) {
    throw new AppError("Screen not found or inactive", 400);
  }
  if (screen.theaterId !== theater.id) {
    throw new AppError("Selected screen does not belong to selected theater", 400);
  }

  return prisma.show.create({
    data: {
      movieId: payload.movieId,
      theaterId: payload.theaterId,
      screenId: payload.screenId,
      startTime: payload.startTime,
      endTime: payload.endTime,
      basePrice: payload.basePrice,
      pricingProfile: payload.pricingProfile,
      status: "SCHEDULED",
    },
    include: {
      movie: { select: { id: true, title: true } },
      theater: { select: { id: true, name: true, cityId: true } },
      screen: { select: { id: true, name: true, screenType: true } },
    },
  });
}

export async function updateShow(id, payload) {
  const show = await prisma.show.findUnique({ where: { id } });
  if (!show) {
    throw new AppError("Show not found", 404);
  }

  return prisma.show.update({
    where: { id },
    data: {
      ...(payload.startTime !== undefined ? { startTime: payload.startTime } : {}),
      ...(payload.endTime !== undefined ? { endTime: payload.endTime } : {}),
      ...(payload.basePrice !== undefined ? { basePrice: payload.basePrice } : {}),
      ...(payload.pricingProfile !== undefined ? { pricingProfile: payload.pricingProfile } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
    },
    include: {
      movie: { select: { id: true, title: true } },
      theater: { select: { id: true, name: true, cityId: true } },
      screen: { select: { id: true, name: true, screenType: true } },
    },
  });
}

export async function deleteShow(id) {
  const show = await prisma.show.findUnique({ where: { id } });
  if (!show) {
    throw new AppError("Show not found", 404);
  }

  if (show.status === "CANCELLED") {
    return show;
  }

  return prisma.show.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
}
