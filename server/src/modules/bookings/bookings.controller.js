import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccess } from "../../common/utils/api-response.js";
import * as bookingsService from "./bookings.service.js";

export const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingsService.createBooking({
    userId: req.user.sub,
    showId: req.validated.body.showId,
    showSeatIds: req.validated.body.showSeatIds,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Booking created and seats locked successfully",
    data: booking,
  });
});

export const listMyBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingsService.listMyBookings(req.user.sub);

  return sendSuccess(res, {
    message: "Bookings fetched successfully",
    data: bookings,
  });
});

export const listBookings = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const bookings = isAdmin
    ? await bookingsService.listAllBookings()
    : await bookingsService.listMyBookings(req.user.sub);

  return sendSuccess(res, {
    message: "Bookings fetched successfully",
    data: bookings,
  });
});

export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await bookingsService.getBookingById(req.validated.params.id, req.user);

  return sendSuccess(res, {
    message: "Booking fetched successfully",
    data: booking,
  });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingsService.cancelBooking({
    bookingId: req.validated.params.id,
    requestUser: req.user,
  });

  return sendSuccess(res, {
    message: "Amount refunded successfully and seats released",
    data: booking,
  });
});
