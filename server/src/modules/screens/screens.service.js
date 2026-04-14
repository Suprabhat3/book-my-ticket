import { prisma } from "../../db/prisma.js";
import { AppError } from "../../common/utils/app-error.js";

function getRowLabel(index) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const first = Math.floor(index / alphabet.length) - 1;
  const second = index % alphabet.length;

  if (first < 0) {
    return alphabet[second];
  }

  return `${alphabet[first]}${alphabet[second]}`;
}

function buildSeatRows(totalRows, totalCols, layoutProfile) {
  const regularRows = Number(layoutProfile?.regularRows || 0);
  const coupleRows = Number(layoutProfile?.coupleRows || 0);
  const reclinerRows = Number(layoutProfile?.reclinerRows || 0);
  const configuredRows = regularRows + coupleRows + reclinerRows;

  const safeRegularRows = configuredRows > 0 ? regularRows : totalRows;
  const safeCoupleRows = configuredRows > 0 ? coupleRows : 0;

  const rows = [];

  for (let rowIndex = 0; rowIndex < totalRows; rowIndex += 1) {
    const rowLabel = getRowLabel(rowIndex);
    let seatType = "REGULAR";

    if (rowIndex >= safeRegularRows + safeCoupleRows) {
      seatType = "RECLINER";
    } else if (rowIndex >= safeRegularRows) {
      seatType = "COUPLE";
    }

    const seatsInRow = seatType === "RECLINER" ? Math.max(1, Math.floor(totalCols / 2)) : totalCols;
    for (let seatNumber = 1; seatNumber <= seatsInRow; seatNumber += 1) {
      rows.push({
        rowLabel,
        seatNumber,
        seatLabel: `${rowLabel}${seatNumber}`,
        seatType,
      });
    }
  }

  return rows;
}

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

  return prisma.$transaction(async (tx) => {
    const screen = await tx.screen.create({
      data: {
        theaterId: payload.theaterId,
        name: payload.name.trim(),
        screenType: payload.screenType,
        totalRows: payload.totalRows,
        totalCols: payload.totalCols,
        seatCapacity: payload.seatCapacity,
        layoutProfile: payload.layoutProfile,
        isActive: true,
      },
      include: {
        theater: {
          select: { id: true, name: true, cityId: true },
        },
      },
    });

    const seatRows = buildSeatRows(payload.totalRows, payload.totalCols, payload.layoutProfile);
    if (seatRows.length === 0) {
      throw new AppError("Screen layout produced zero seats", 400);
    }

    await tx.screenSeat.createMany({
      data: seatRows.map((seat) => ({
        screenId: screen.id,
        rowLabel: seat.rowLabel,
        seatNumber: seat.seatNumber,
        seatLabel: seat.seatLabel,
        seatType: seat.seatType,
        isActive: true,
      })),
    });

    return screen;
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
      ...(payload.layoutProfile !== undefined ? { layoutProfile: payload.layoutProfile } : {}),
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

export async function getScreenSeatTypes(screenId) {
  const screen = await prisma.screen.findUnique({
    where: { id: screenId },
    select: { id: true, isActive: true },
  });

  if (!screen || !screen.isActive) {
    throw new AppError("Screen not found or inactive", 404);
  }

  const seats = await prisma.screenSeat.findMany({
    where: {
      screenId,
      isActive: true,
    },
    select: {
      seatType: true,
    },
  });

  if (!seats.length) {
    throw new AppError("No active seats found for this screen", 400);
  }

  const seatTypeCounts = seats.reduce(
    (accumulator, seat) => {
      const current = accumulator[seat.seatType] || 0;
      accumulator[seat.seatType] = current + 1;
      return accumulator;
    },
    {},
  );

  const preferredOrder = ["REGULAR", "COUPLE", "RECLINER"];
  const seatTypes = preferredOrder.filter((seatType) => Number(seatTypeCounts[seatType]) > 0);

  return {
    screenId,
    seatTypes,
    seatTypeCounts,
  };
}
