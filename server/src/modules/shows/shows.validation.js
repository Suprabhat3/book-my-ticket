import { z } from "zod";

const showStatusEnum = z.enum(["SCHEDULED", "CANCELLED", "COMPLETED"]);

export const listShowsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    movieId: z.coerce.number().int().positive().optional(),
    theaterId: z.coerce.number().int().positive().optional(),
    screenId: z.coerce.number().int().positive().optional(),
    status: showStatusEnum.optional(),
  }),
});

export const createShowSchema = z.object({
  body: z
    .object({
      movieId: z.coerce.number().int().positive(),
      theaterId: z.coerce.number().int().positive(),
      screenId: z.coerce.number().int().positive(),
      startTime: z.coerce.date(),
      endTime: z.coerce.date(),
      basePrice: z.coerce.number().positive(),
      pricingProfile: z.any().optional(),
    })
    .refine((value) => value.endTime > value.startTime, {
      message: "End time must be after start time",
      path: ["endTime"],
    }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateShowSchema = z.object({
  body: z
    .object({
      startTime: z.coerce.date().optional(),
      endTime: z.coerce.date().optional(),
      basePrice: z.coerce.number().positive().optional(),
      pricingProfile: z.any().optional(),
      status: showStatusEnum.optional(),
    })
    .refine(
      (value) => !value.startTime || !value.endTime || value.endTime > value.startTime,
      "End time must be after start time",
    )
    .refine((value) => Object.keys(value).length > 0, "At least one field is required to update"),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
});

export const showIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
});

const seatLockBodySchema = z.object({
  showSeatIds: z.array(z.coerce.number().int().positive()).min(1).max(10),
});

export const lockShowSeatsSchema = z.object({
  body: seatLockBodySchema,
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
});

export const unlockShowSeatsSchema = z.object({
  body: seatLockBodySchema,
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
});
