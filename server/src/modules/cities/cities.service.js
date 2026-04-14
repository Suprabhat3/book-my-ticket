import { prisma } from "../../db/prisma.js";
import { AppError } from "../../common/utils/app-error.js";

export async function listCities({ includeInactive = false, search = "" }) {
  return prisma.city.findMany({
    where: {
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
    orderBy: { name: "asc" },
  });
}

export async function createCity(payload) {
  const normalizedName = payload.name.trim();

  const existing = await prisma.city.findFirst({
    where: {
      name: {
        equals: normalizedName,
        mode: "insensitive",
      },
    },
  });

  if (existing) {
    throw new AppError("City already exists", 409);
  }

  return prisma.city.create({
    data: {
      name: normalizedName,
      state: payload.state?.trim() || null,
      country: payload.country?.trim() || "India",
      isActive: true,
    },
  });
}

export async function updateCity(id, payload) {
  const city = await prisma.city.findUnique({ where: { id } });
  if (!city) {
    throw new AppError("City not found", 404);
  }

  if (payload.name) {
    const duplicate = await prisma.city.findFirst({
      where: {
        id: { not: id },
        name: {
          equals: payload.name.trim(),
          mode: "insensitive",
        },
      },
    });

    if (duplicate) {
      throw new AppError("Another city with this name already exists", 409);
    }
  }

  return prisma.city.update({
    where: { id },
    data: {
      ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
      ...(payload.state !== undefined ? { state: payload.state.trim() || null } : {}),
      ...(payload.country !== undefined ? { country: payload.country.trim() || "India" } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
    },
  });
}

export async function deactivateCity(id) {
  const city = await prisma.city.findUnique({ where: { id } });
  if (!city) {
    throw new AppError("City not found", 404);
  }

  if (!city.isActive) {
    return city;
  }

  return prisma.city.update({
    where: { id },
    data: { isActive: false },
  });
}
