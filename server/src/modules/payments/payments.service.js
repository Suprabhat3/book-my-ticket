import crypto from "node:crypto";
import Razorpay from "razorpay";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../common/utils/app-error.js";
import { env } from "../../config/env.js";

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

function getRazorpayClient() {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    throw new AppError("Razorpay is not configured on server", 500);
  }

  return new Razorpay({
    key_id: env.razorpayKeyId,
    key_secret: env.razorpayKeySecret,
  });
}

function assertBookingAccess(booking, requestUser) {
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  if (requestUser.role !== "ADMIN" && booking.userId !== requestUser.sub) {
    throw new AppError("Forbidden", 403);
  }
}

function hasSeatLockExpired(lockedSeats, now = new Date()) {
  return lockedSeats.some(
    (seat) =>
      seat.status !== "LOCKED" ||
      !seat.lockedUntil ||
      seat.lockedUntil < now ||
      !seat.lockedByUserId ||
      seat.lockedByUserId !== seat.expectedUserId,
  );
}

async function markBookingFailedAndReleaseSeats(tx, booking) {
  await tx.booking.update({
    where: { id: booking.id },
    data: { status: "FAILED" },
  });

  if (booking.payment) {
    await tx.payment.update({
      where: { bookingId: booking.id },
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
      lockedByUserId: null,
    },
  });
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  if (!env.razorpayKeySecret) {
    throw new AppError("Razorpay is not configured on server", 500);
  }

  const generated = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const generatedBuffer = Buffer.from(generated);
  const signatureBuffer = Buffer.from(signature);
  if (generatedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(generatedBuffer, signatureBuffer);
}

async function finalizePayment({ bookingId, requestUser, isSuccess, paymentId, orderId, signature }) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        seats: true,
        payment: true,
      },
    });

    assertBookingAccess(booking, requestUser);

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
        lockedByUserId: true,
      },
    });

    const lockedSeatsWithOwner = lockedSeats.map((seat) => ({
      ...seat,
      expectedUserId: booking.userId,
    }));

    if (hasSeatLockExpired(lockedSeatsWithOwner)) {
      await markBookingFailedAndReleaseSeats(tx, booking);
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
            razorpayOrderId: orderId || booking.payment.razorpayOrderId,
            razorpayPaymentId: paymentId || booking.payment.razorpayPaymentId,
            razorpaySignature: signature || booking.payment.razorpaySignature,
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
          lockedByUserId: null,
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
          lockedByUserId: null,
        },
      });
    }

    return tx.booking.findUnique({
      where: { id: bookingId },
      include: paymentResultInclude,
    });
  });
}

export async function completePayment({ bookingId, requestUser, isSuccess, paymentId }) {
  return finalizePayment({
    bookingId,
    requestUser,
    isSuccess,
    paymentId,
  });
}

export async function createRazorpayOrder({ bookingId, requestUser }) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      seats: true,
      payment: true,
    },
  });

  assertBookingAccess(booking, requestUser);

  if (booking.status !== "PENDING") {
    throw new AppError("Booking is not pending payment", 400);
  }

  const lockedSeats = await prisma.showSeat.findMany({
    where: {
      id: { in: booking.seats.map((seat) => seat.showSeatId) },
      showId: booking.showId,
    },
    select: {
      id: true,
      lockedUntil: true,
      status: true,
      lockedByUserId: true,
    },
  });

  const lockedSeatsWithOwner = lockedSeats.map((seat) => ({
    ...seat,
    expectedUserId: booking.userId,
  }));

  if (hasSeatLockExpired(lockedSeatsWithOwner)) {
    await prisma.$transaction(async (tx) => {
      await markBookingFailedAndReleaseSeats(tx, booking);
    });
    throw new AppError("Seat hold has expired. Please retry booking.", 409);
  }

  if (booking.payment?.razorpayOrderId) {
    return {
      keyId: env.razorpayKeyId,
      orderId: booking.payment.razorpayOrderId,
      amount: Math.round(Number(booking.totalAmount) * 100),
      currency: booking.payment.currency || "INR",
      bookingId: booking.id,
    };
  }

  const client = getRazorpayClient();
  const amount = Math.round(Number(booking.totalAmount) * 100);
  const currency = booking.payment?.currency || "INR";
  const order = await client.orders.create({
    amount,
    currency,
    receipt: booking.id,
    notes: {
      bookingId: booking.id,
      showId: String(booking.showId),
      userId: booking.userId,
    },
  });

  if (booking.payment) {
    await prisma.payment.update({
      where: { bookingId: booking.id },
      data: {
        provider: "RAZORPAY",
        status: "CREATED",
        razorpayOrderId: order.id,
      },
    });
  } else {
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: "RAZORPAY",
        status: "CREATED",
        amount: booking.totalAmount,
        currency: "INR",
        razorpayOrderId: order.id,
      },
    });
  }

  return {
    keyId: env.razorpayKeyId,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    bookingId: booking.id,
  };
}

export async function verifyRazorpayPayment({
  bookingId,
  requestUser,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
    },
  });

  assertBookingAccess(booking, requestUser);

  if (booking.status !== "PENDING") {
    throw new AppError("Booking is not pending payment", 400);
  }

  if (!booking.payment?.razorpayOrderId) {
    throw new AppError("Razorpay order not created for this booking", 400);
  }

  if (booking.payment.razorpayOrderId !== razorpayOrderId) {
    throw new AppError("Razorpay order mismatch", 400);
  }

  const isValidSignature = verifyRazorpaySignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!isValidSignature) {
    throw new AppError("Invalid Razorpay payment signature", 400);
  }

  return finalizePayment({
    bookingId,
    requestUser,
    isSuccess: true,
    paymentId: razorpayPaymentId,
    orderId: razorpayOrderId,
    signature: razorpaySignature,
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
