import { prisma } from "../../db/prisma.js";
import { AppError } from "../../common/utils/app-error.js";

const paymentResultInclude = {
  show: {
    select: {
      id: true,
      startTime: true,
      endTime: true,
      movie: {
        select: {
          id: true,
          title: true,
          posterHorizontalUrl: true,
          posterVerticalUrl: true,
        },
      },
      theater: {
        select: {
          id: true,
          name: true,
          addressLine: true,
        },
      },
      screen: {
        select: {
          id: true,
          name: true,
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
              seatLabel: true,
              seatType: true,
              rowLabel: true,
              seatNumber: true,
            },
          },
        },
      },
    },
  },
  payment: true,
};

export async function completePayment({ bookingId, requestUser, isSuccess, paymentId }) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        seats: true,
        payment: true,
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (requestUser.role !== "ADMIN" && booking.userId !== requestUser.sub) {
      throw new AppError("Forbidden", 403);
    }

    if (booking.status !== "PENDING") {
      throw new AppError("Booking is not pending payment", 400);
    }

    const lockedSeats = await tx.showSeat.findMany({
      where: {
        id: { in: booking.seats.map((seat) => seat.showSeatId) },
        showId: booking.showId,
      },
      select: {
        id: true,
        lockedUntil: true,
        status: true,
      },
    });

    const now = new Date();
    const lockExpired = lockedSeats.some(
      (seat) => seat.status !== "LOCKED" || !seat.lockedUntil || seat.lockedUntil < now,
    );

    if (lockExpired) {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "FAILED" },
      });

      if (booking.payment) {
        await tx.payment.update({
          where: { bookingId },
          data: { status: "FAILED" },
        });
      }

      await tx.showSeat.updateMany({
        where: {
          id: { in: booking.seats.map((seat) => seat.showSeatId) },
        },
        data: {
          status: "AVAILABLE",
          lockedUntil: null,
        },
      });

      throw new AppError("Seat hold has expired. Please retry booking.", 409);
    }

    if (isSuccess) {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "PAID" },
      });

      if (booking.payment) {
        await tx.payment.update({
          where: { bookingId },
          data: {
            status: "CAPTURED",
            razorpayPaymentId: paymentId || booking.payment.razorpayPaymentId,
          },
        });
      }

      await tx.showSeat.updateMany({
        where: {
          id: { in: booking.seats.map((seat) => seat.showSeatId) },
        },
        data: {
          status: "BOOKED",
          lockedUntil: null,
        },
      });
    } else {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "FAILED" },
      });

      if (booking.payment) {
        await tx.payment.update({
          where: { bookingId },
          data: {
            status: "FAILED",
            razorpayPaymentId: paymentId || booking.payment.razorpayPaymentId,
          },
        });
      }

      await tx.showSeat.updateMany({
        where: {
          id: { in: booking.seats.map((seat) => seat.showSeatId) },
        },
        data: {
          status: "AVAILABLE",
          lockedUntil: null,
        },
      });
    }

    return tx.booking.findUnique({
      where: { id: bookingId },
      include: paymentResultInclude,
    });
  });
}

export async function listPayments(requestUser) {
  const where =
    requestUser.role === "ADMIN"
      ? {}
      : {
          booking: {
            userId: requestUser.sub,
          },
        };

  return prisma.payment.findMany({
    where,
    include: {
      booking: {
        select: {
          id: true,
          status: true,
          totalAmount: true,
          userId: true,
          show: {
            select: {
              id: true,
              startTime: true,
              movie: {
                select: {
                  id: true,
                  title: true,
                },
              },
              theater: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
