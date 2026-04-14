import { prisma } from "../../db/prisma.js";
import { AppError } from "../../common/utils/app-error.js";

export async function listScreens({ theaterId, includeInactive = false }) {
  return prisma.screen.findMany({
    where: {
      ...(theaterId ? { theaterId } : {}),
      ...(includeInactive ? {} : { isActive: true }),
    },
    include: {
      theater: {
        select: { id: true, name: true, cityId: true },
      },
    },
    orderBy: [{ theaterId: "asc" }, { name: "asc" }],
  });
}

export async function createScreen(payload) {
  const theater = await prisma.theater.findUnique({ where: { id: payload.theaterId } });
  if (!theater || !theater.isActive) {
    throw new AppError("Theater not found or inactive", 400);
  }

  const duplicate = await prisma.screen.findFirst({
    where: {
      theaterId: payload.theaterId,
      name: {
        equals: payload.name.trim(),
        mode: "insensitive",
      },
    },
  });

  if (duplicate) {
    throw new AppError("Screen with this name already exists in selected theater", 409);
  }

  return prisma.screen.create({
    data: {
      theaterId: payload.theaterId,
      name: payload.name.trim(),
      screenType: payload.screenType,
      totalRows: payload.totalRows,
      totalCols: payload.totalCols,
      seatCapacity: payload.seatCapacity,
      isActive: true,
    },
    include: {
      theater: {
        select: { id: true, name: true, cityId: true },
      },
    },
  });
}

export async function updateScreen(id, payload) {
  const screen = await prisma.screen.findUnique({ where: { id } });
  if (!screen) {
    throw new AppError("Screen not found", 404);
  }

  return prisma.screen.update({
    where: { id },
    data: {
      ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
      ...(payload.screenType !== undefined ? { screenType: payload.screenType } : {}),
      ...(payload.totalRows !== undefined ? { totalRows: payload.totalRows } : {}),
      ...(payload.totalCols !== undefined ? { totalCols: payload.totalCols } : {}),
      ...(payload.seatCapacity !== undefined ? { seatCapacity: payload.seatCapacity } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
    },
    include: {
      theater: {
        select: { id: true, name: true, cityId: true },
      },
    },
  });
}

export async function deactivateScreen(id) {
  const screen = await prisma.screen.findUnique({ where: { id } });
  if (!screen) {
    throw new AppError("Screen not found", 404);
  }

  if (!screen.isActive) {
    return screen;
  }

  return prisma.screen.update({
    where: { id },
    data: { isActive: false },
  });
}
