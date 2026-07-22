import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { createError } from "../middleware/errorHandler";

// ─── Get Full Seat Map ──────────────────────────────────────────────────
export async function getSeatMap(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const eventId = req.params.eventId as string;

    const sections = await prisma.seatSection.findMany({
      where: { eventId },
      orderBy: { sortOrder: "asc" },
      include: {
        rows: {
          orderBy: { sortOrder: "asc" },
          include: {
            seats: {
              orderBy: { seatNumber: "asc" },
            },
          },
        },
      },
    });

    res.json({ success: true, data: sections });
  } catch (err) {
    next(err);
  }
}

// ─── Create Section ─────────────────────────────────────────────────────
export async function createSection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const eventId = req.params.eventId as string;
    const sellerId = req.user!.userId;

    const event = await prisma.event.findFirst({ where: { id: eventId, sellerId } });
    if (!event) throw createError("Access denied", 403);

    const { name, label, color, price, rowCount, seatsPerRow, sortOrder = 0 } = req.body;

    const section = await prisma.seatSection.create({
      data: { eventId, name, label, color, price, rowCount, seatsPerRow, sortOrder },
    });

    res.status(201).json({ success: true, data: section });
  } catch (err) {
    next(err);
  }
}

// ─── Update Section ─────────────────────────────────────────────────────
export async function updateSection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const eventId = req.params.eventId as string;
    const sectionId = req.params.sectionId as string;
    const sellerId = req.user!.userId;

    const event = await prisma.event.findFirst({ where: { id: eventId, sellerId } });
    if (!event) throw createError("Access denied", 403);

    const { name, label, color, price, sortOrder } = req.body;

    const updated = await prisma.seatSection.update({
      where: { id: sectionId },
      data: { name, label, color, price, sortOrder },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// ─── Delete Section ─────────────────────────────────────────────────────
export async function deleteSection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const eventId = req.params.eventId as string;
    const sectionId = req.params.sectionId as string;
    const sellerId = req.user!.userId;

    const event = await prisma.event.findFirst({ where: { id: eventId, sellerId } });
    if (!event) throw createError("Access denied", 403);

    await prisma.seatSection.delete({ where: { id: sectionId } });
    res.json({ success: true, message: "Section deleted" });
  } catch (err) {
    next(err);
  }
}

// ─── Generate Seats (auto-generate from rowCount x seatsPerRow) ─────────
export async function generateSeats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const eventId = req.params.eventId as string;
    const sectionId = req.params.sectionId as string;
    const sellerId = req.user!.userId;

    const event = await prisma.event.findFirst({ where: { id: eventId, sellerId } });
    if (!event) throw createError("Access denied", 403);

    const section = await prisma.seatSection.findFirst({
      where: { id: sectionId, eventId },
    });
    if (!section) throw createError("Section not found", 404);

    // Clear existing seats
    await prisma.seat.deleteMany({
      where: { row: { sectionId } },
    });
    await prisma.seatRow.deleteMany({ where: { sectionId } });

    // Re-generate rows and seats
    const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const created = await prisma.$transaction(async (tx) => {
      const rows = [];
      for (let r = 0; r < section.rowCount; r++) {
        const rowLabel = rowLabels[r] || `R${r + 1}`;
        const row = await tx.seatRow.create({
          data: {
            sectionId,
            rowLabel,
            sortOrder: r,
          },
        });

        const seats = [];
        for (let s = 1; s <= section.seatsPerRow; s++) {
          seats.push(
            tx.seat.create({
              data: {
                rowId: row.id,
                seatNumber: String(s),
                seatLabel: `${rowLabel}${s}`,
                status: "AVAILABLE",
              },
            })
          );
        }
        await Promise.all(seats);
        rows.push(row);
      }
      return rows;
    });

    res.json({
      success: true,
      message: `Generated ${section.rowCount} rows × ${section.seatsPerRow} seats`,
      data: { rowCount: created.length },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Block / Unblock Seat ───────────────────────────────────────────────
export async function blockSeat(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const eventId = req.params.eventId as string;
    const seatId = req.params.seatId as string;
    const { blocked } = req.body;
    const sellerId = req.user!.userId;

    const event = await prisma.event.findFirst({ where: { id: eventId, sellerId } });
    if (!event) throw createError("Access denied", 403);

    await prisma.seat.update({
      where: { id: seatId },
      data: { status: blocked ? "BLOCKED" : "AVAILABLE" },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
