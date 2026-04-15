import { prisma } from "../../db/prisma.js";
import { AppError } from "../../common/utils/app-error.js";

const SEAT_HOLD_MINUTES = 5;

function resolveSeatPrice(basePrice, pricingProfile, seatType) {
  if (!pricingProfile || typeof pricingProfile !== "object") {
    return basePrice;
  }

  if (seatType === "COUPLE" && Number(pricingProfile.couplePrice) > 0) {
    return Number(pricingProfile.couplePrice);
  }

  if (seatType === "RECLINER" && Number(pricingProfile.reclinerPrice) > 0) {
    return Number(pricingProfile.reclinerPrice);
  }

  return basePrice;
}

async function releaseExpiredSeatLocks(tx, showId) {
  await tx.showSeat.updateMany({
    where: {
      showId,
      status: "LOCKED",
      lockedUntil: {
        lt: new Date(),
      },
    },
    data: {
      status: "AVAILABLE",
      lockedUntil: null,
      lockedByUserId: null,
    },
  });
}

async function ensureShowSeatsExist(tx, show) {
  const currentCount = await tx.showSeat.count({
    where: { showId: show.id },
  });

  if (currentCount > 0) {
    return;
  }

  const activeScreenSeats = await tx.screenSeat.findMany({
    where: {
      screenId: show.screen.id,
      isActive: true,
    },
    select: {
      id: true,
      seatType: true,
    },
  });

  if (!activeScreenSeats.length) {
    throw new AppError("No seats configured for this show", 400);
  }

  await tx.showSeat.createMany({
    data: activeScreenSeats.map((screenSeat) => ({
      showId: show.id,
      screenSeatId: screenSeat.id,
      price: resolveSeatPrice(show.basePrice, show.pricingProfile, screenSeat.seatType),
      status: "AVAILABLE",
    })),
  });
}

function assertShowAfterMovieRelease(movie, startTime) {
  if (!(startTime instanceof Date) || Number.isNaN(startTime.getTime())) {
    throw new AppError("Invalid show start time", 400);
  }

  if (!(movie?.releaseDate instanceof Date) || Number.isNaN(movie.releaseDate.getTime())) {
    throw new AppError("Movie release date is invalid", 400);
  }

  if (startTime < movie.releaseDate) {
    throw new AppError("Show start time cannot be before movie release date", 400);
  }
}

export async function listShows({ movieId, theaterId, screenId, status, publicOnly = false }) {
  const now = new Date();

  return prisma.show.findMany({
    where: {
      ...(movieId ? { movieId } : {}),
      ...(theaterId ? { theaterId } : {}),
      ...(screenId ? { screenId } : {}),
      ...(status ? { status } : {}),
      ...(publicOnly
        ? {
            status: "SCHEDULED",
            startTime: {
              gt: now,
            },
            movie: { isActive: true },
            theater: { isActive: true },
            screen: { isActive: true },
          }
        : {}),
    },
    include: {
      movie: {
        select: {
          id: true,
          title: true,
          durationMinutes: true,
          genre: true,
          language: true,
          posterHorizontalUrl: true,
          posterVerticalUrl: true,
        },
      },
      theater: { select: { id: true, name: true, cityId: true, addressLine: true } },
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

  assertShowAfterMovieRelease(movie, payload.startTime);

  const activeScreenSeats = await prisma.screenSeat.findMany({
    where: {
      screenId: payload.screenId,
      isActive: true,
    },
    select: {
      id: true,
      seatType: true,
    },
  });

  if (activeScreenSeats.length === 0) {
    throw new AppError("No seats found for selected screen", 400);
  }

  return prisma.$transaction(async (tx) => {
    const show = await tx.show.create({
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

    await tx.showSeat.createMany({
      data: activeScreenSeats.map((screenSeat) => ({
        showId: show.id,
        screenSeatId: screenSeat.id,
        price: resolveSeatPrice(payload.basePrice, payload.pricingProfile, screenSeat.seatType),
        status: "AVAILABLE",
      })),
    });

    return show;
  });
}

export async function updateShow(id, payload) {
  const show = await prisma.show.findUnique({
    where: { id },
    include: {
      movie: {
        select: {
          releaseDate: true,
        },
      },
    },
  });
  if (!show) {
    throw new AppError("Show not found", 404);
  }

  if (payload.startTime !== undefined) {
    assertShowAfterMovieRelease(show.movie, payload.startTime);
  }

  const shouldRefreshSeatPrices = payload.basePrice !== undefined || payload.pricingProfile !== undefined;

  return prisma.$transaction(async (tx) => {
    const updatedShow = await tx.show.update({
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

    if (shouldRefreshSeatPrices) {
      const basePriceToUse = Number(payload.basePrice ?? show.basePrice);
      const pricingProfileToUse = payload.pricingProfile ?? show.pricingProfile;

      const availableSeats = await tx.showSeat.findMany({
        where: {
          showId: id,
          status: "AVAILABLE",
        },
        select: {
          id: true,
          screenSeat: {
            select: {
              seatType: true,
            },
          },
        },
      });

      if (availableSeats.length) {
        await Promise.all(
          availableSeats.map((seat) =>
            tx.showSeat.update({
              where: { id: seat.id },
              data: {
                price: resolveSeatPrice(basePriceToUse, pricingProfileToUse, seat.screenSeat.seatType),
              },
            }),
          ),
        );
      }
    }

    return updatedShow;
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

export async function lockShowSeats({ showId, userId, showSeatIds }) {
  return prisma.$transaction(async (tx) => {
    const show = await tx.show.findUnique({
      where: { id: showId },
      select: {
        id: true,
        status: true,
        startTime: true,
        screen: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!show || show.status !== "SCHEDULED") {
      throw new AppError("Show is not available for booking", 400);
    }

    if (show.startTime <= new Date()) {
      throw new AppError("Show has already started", 400);
    }

    await ensureShowSeatsExist(tx, show);
    await releaseExpiredSeatLocks(tx, showId);

    const seats = await tx.showSeat.findMany({
      where: {
        id: { in: showSeatIds },
        showId,
      },
      select: {
        id: true,
        status: true,
        lockedByUserId: true,
        screenSeat: {
          select: {
            seatLabel: true,
          },
        },
      },
    });

    if (seats.length !== showSeatIds.length) {
      throw new AppError("One or more seats are invalid for this show", 400);
    }

    const hasConflict = seats.some(
      (seat) => seat.status === "BOOKED" || (seat.status === "LOCKED" && seat.lockedByUserId !== userId),
    );
    if (hasConflict) {
      throw new AppError("Some selected seats are no longer available", 409);
    }

    const holdUntil = new Date(Date.now() + SEAT_HOLD_MINUTES * 60 * 1000);

    for (const seat of seats) {
      const lockResult = await tx.showSeat.updateMany({
        where: {
          id: seat.id,
          OR: [
            { status: "AVAILABLE" },
            {
              status: "LOCKED",
              lockedByUserId: userId,
            },
          ],
        },
        data: {
          status: "LOCKED",
          lockedUntil: holdUntil,
          lockedByUserId: userId,
        },
      });

      if (lockResult.count !== 1) {
        throw new AppError("Some selected seats were just booked by another user", 409);
      }
    }

    return {
      showId,
      showSeatIds,
      seatHoldExpiresAt: holdUntil,
    };
  });
}

export async function unlockShowSeats({ showId, userId, showSeatIds }) {
  const releaseResult = await prisma.showSeat.updateMany({
    where: {
      showId,
      id: {
        in: showSeatIds,
      },
      status: "LOCKED",
      lockedByUserId: userId,
    },
    data: {
      status: "AVAILABLE",
      lockedUntil: null,
      lockedByUserId: null,
    },
  });

  return {
    showId,
    releasedCount: releaseResult.count,
    showSeatIds,
  };
}

export async function getPublicShowSeatMap(showId, requesterUserId) {
  return prisma.$transaction(async (tx) => {
    const now = new Date();

    await releaseExpiredSeatLocks(tx, showId);

    const show = await tx.show.findFirst({
      where: {
        id: showId,
        status: "SCHEDULED",
        startTime: {
          gt: now,
        },
        movie: { isActive: true },
        theater: { isActive: true },
        screen: { isActive: true },
      },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            durationMinutes: true,
            language: true,
            genre: true,
            posterHorizontalUrl: true,
            posterVerticalUrl: true,
          },
        },
        theater: {
          select: {
            id: true,
            name: true,
            cityId: true,
            addressLine: true,
          },
        },
        screen: {
          select: {
            id: true,
            name: true,
            screenType: true,
            totalRows: true,
            totalCols: true,
            layoutProfile: true,
          },
        },
      },
    });

    if (!show) {
      throw new AppError("Show has already started", 400);
    }

    await ensureShowSeatsExist(tx, show);

    const seats = await tx.showSeat.findMany({
      where: { showId },
      include: {
        screenSeat: {
          select: {
            id: true,
            rowLabel: true,
            seatNumber: true,
            seatLabel: true,
            seatType: true,
          },
        },
      },
      orderBy: [{ screenSeat: { rowLabel: "asc" } }, { screenSeat: { seatNumber: "asc" } }],
    });

    const seatsWithLockOwnership = seats.map((seat) => {
      const { lockedByUserId, ...seatWithoutOwner } = seat;
      return {
        ...seatWithoutOwner,
        isLockedByCurrentUser:
          seat.status === "LOCKED" && Boolean(requesterUserId) && lockedByUserId === requesterUserId,
      };
    });

    return {
      ...show,
      seats: seatsWithLockOwnership,
    };
  });
}
