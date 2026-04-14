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

async function ensureShowSeatsExist(tx, show) {
  const existingCount = await tx.showSeat.count({
    where: { showId: show.id },
  });

  if (existingCount > 0) {
    return;
  }

  const screenSeats = await tx.screenSeat.findMany({
    where: {
      screenId: show.screenId,
      isActive: true,
    },
    select: {
      id: true,
      seatType: true,
    },
  });

  if (!screenSeats.length) {
    throw new AppError("Show seats are not configured for this screen", 400);
  }

  await tx.showSeat.createMany({
    data: screenSeats.map((screenSeat) => ({
      showId: show.id,
      screenSeatId: screenSeat.id,
      price: resolveSeatPrice(show.basePrice, show.pricingProfile, screenSeat.seatType),
      status: "AVAILABLE",
    })),
  });
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

const bookingInclude = {
  show: {
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      movie: {
        select: {
          id: true,
          title: true,
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
          addressLine: true,
          cityId: true,
        },
      },
      screen: {
        select: {
          id: true,
          name: true,
          screenType: true,
        },
      },
    },
  },
  seats: {
    include: {
      showSeat: {
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
      },
    },
  },
  payment: {
    select: {
      id: true,
      status: true,
      amount: true,
      currency: true,
      provider: true,
      razorpayOrderId: true,
      razorpayPaymentId: true,
      createdAt: true,
      updatedAt: true,
    },
  },
};

export async function createBooking({ userId, showId, showSeatIds }) {
  return prisma.$transaction(async (tx) => {
    const show = await tx.show.findUnique({
      where: { id: showId },
      select: {
        id: true,
        screenId: true,
        startTime: true,
        status: true,
        basePrice: true,
        pricingProfile: true,
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
        price: true,
        status: true,
        lockedByUserId: true,
        screenSeat: {
          select: {
            id: true,
            seatLabel: true,
            seatType: true,
          },
        },
      },
    });

    if (seats.length !== showSeatIds.length) {
      throw new AppError("One or more seats are invalid for this show", 400);
    }

    const unavailable = seats.filter(
      (seat) => seat.status === "BOOKED" || (seat.status === "LOCKED" && seat.lockedByUserId !== userId),
    );
    if (unavailable.length > 0) {
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

    const totalAmount = seats.reduce((sum, seat) => sum + Number(seat.price), 0);

    const booking = await tx.booking.create({
      data: {
        userId,
        showId,
        status: "PENDING",
        totalAmount,
        seats: {
          createMany: {
            data: seats.map((seat) => ({
              showSeatId: seat.id,
              price: seat.price,
            })),
          },
        },
        payment: {
          create: {
            amount: totalAmount,
            currency: "INR",
            status: "CREATED",
            provider: "RAZORPAY",
          },
        },
      },
      include: bookingInclude,
    });

    return {
      ...booking,
      seatHoldExpiresAt: holdUntil,
    };
  });
}

export async function listMyBookings(userId) {
  return prisma.booking.findMany({
    where: { userId },
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function listAllBookings() {
  return prisma.booking.findMany({
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getBookingById(id, requestUser) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: bookingInclude,
  });

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  if (requestUser.role !== "ADMIN" && booking.userId !== requestUser.sub) {
    throw new AppError("Forbidden", 403);
  }

  return booking;
}
