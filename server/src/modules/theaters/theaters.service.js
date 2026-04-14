import { prisma } from "../../db/prisma.js";
import { AppError } from "../../common/utils/app-error.js";

export async function listTheaters({ cityId, includeInactive = false, search = "" }) {
  return prisma.theater.findMany({
    where: {
      ...(cityId ? { cityId } : {}),
      ...(includeInactive ? {} : { isActive: true }),
      ...(search
        ? {
            name: {
              contains: search,
              mode: "insensitive",
            },
          }
        : {}),
    },
    include: {
      city: {
        select: { id: true, name: true, state: true },
      },
    },
    orderBy: [{ cityId: "asc" }, { name: "asc" }],
  });
}

export async function createTheater(payload) {
  const city = await prisma.city.findUnique({ where: { id: payload.cityId } });
  if (!city || !city.isActive) {
    throw new AppError("City not found or inactive", 400);
  }

  const duplicate = await prisma.theater.findFirst({
    where: {
      cityId: payload.cityId,
      name: {
        equals: payload.name.trim(),
        mode: "insensitive",
      },
    },
  });

  if (duplicate) {
    throw new AppError("Theater with this name already exists in selected city", 409);
  }

  return prisma.theater.create({
    data: {
      cityId: payload.cityId,
      name: payload.name.trim(),
      addressLine: payload.addressLine.trim(),
      pincode: payload.pincode?.trim() || null,
      isActive: true,
    },
    include: {
      city: {
        select: { id: true, name: true, state: true },
      },
    },
  });
}

export async function updateTheater(id, payload) {
  const theater = await prisma.theater.findUnique({ where: { id } });
  if (!theater) {
    throw new AppError("Theater not found", 404);
  }

  return prisma.theater.update({
    where: { id },
    data: {
      ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
      ...(payload.addressLine !== undefined ? { addressLine: payload.addressLine.trim() } : {}),
      ...(payload.pincode !== undefined ? { pincode: payload.pincode.trim() || null } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
    },
    include: {
      city: {
        select: { id: true, name: true, state: true },
      },
    },
  });
}

export async function deactivateTheater(id) {
  const theater = await prisma.theater.findUnique({ where: { id } });
  if (!theater) {
    throw new AppError("Theater not found", 404);
  }

  if (!theater.isActive) {
    return theater;
  }

  return prisma.theater.update({
    where: { id },
    data: { isActive: false },
  });
}
