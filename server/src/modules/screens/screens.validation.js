import { z } from "zod";

const screenTypeEnum = z.enum(["ELITE", "PREMIUM", "NORMAL"]);

export const listScreensSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    theaterId: z.coerce.number().int().positive().optional(),
    includeInactive: z.enum(["true", "false"]).optional(),
  }),
});

export const createScreenSchema = z.object({
  body: z.object({
    theaterId: z.coerce.number().int().positive(),
    name: z.string().trim().min(2).max(80),
    screenType: screenTypeEnum,
    totalRows: z.coerce.number().int().positive(),
    totalCols: z.coerce.number().int().positive(),
    seatCapacity: z.coerce.number().int().positive(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateScreenSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(80).optional(),
      screenType: screenTypeEnum.optional(),
      totalRows: z.coerce.number().int().positive().optional(),
      totalCols: z.coerce.number().int().positive().optional(),
      seatCapacity: z.coerce.number().int().positive().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required to update"),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
});

export const screenIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
});
