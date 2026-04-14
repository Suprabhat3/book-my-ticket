import { z } from "zod";

export const listMoviesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    includeInactive: z.enum(["true", "false"]).optional(),
    search: z.string().trim().optional(),
    language: z.string().trim().optional(),
  }),
});

export const createMovieSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().min(10).max(2000),
    durationMinutes: z.coerce.number().int().positive(),
    language: z.string().trim().min(2).max(50),
    genre: z.string().trim().min(2).max(80),
    releaseDate: z.coerce.date(),
    posterVerticalUrl: z.string().trim().url().optional(),
    posterVerticalImagekitFileId: z.string().trim().min(1).max(255).optional(),
    posterHorizontalUrl: z.string().trim().url().optional(),
    posterHorizontalImagekitFileId: z.string().trim().min(1).max(255).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateMovieSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(2).max(200).optional(),
      description: z.string().trim().min(10).max(2000).optional(),
      durationMinutes: z.coerce.number().int().positive().optional(),
      language: z.string().trim().min(2).max(50).optional(),
      genre: z.string().trim().min(2).max(80).optional(),
      releaseDate: z.coerce.date().optional(),
      posterVerticalUrl: z.string().trim().url().optional(),
      posterVerticalImagekitFileId: z.string().trim().min(1).max(255).optional(),
      posterHorizontalUrl: z.string().trim().url().optional(),
      posterHorizontalImagekitFileId: z.string().trim().min(1).max(255).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required to update"),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
});

export const movieIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
});

export const moviePublicDetailsParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
});
