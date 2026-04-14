import { z } from "zod";

export const bookingsBaseSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const createBookingSchema = z.object({
  body: z.object({
    showId: z.coerce.number().int().positive(),
    showSeatIds: z.array(z.coerce.number().int().positive()).min(1).max(10),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const bookingIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().trim().min(1),
  }),
  query: z.object({}).optional(),
});
