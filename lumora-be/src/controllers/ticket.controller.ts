import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { createError } from "../middleware/errorHandler";

// ─── Get Ticket Types for Event ────────────────────────────────────────
export async function getTicketTypes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const eventId = req.params.eventId as string;

    const ticketTypes = await prisma.ticketType.findMany({
      where: { eventId },
      orderBy: { sortOrder: "asc" },
      include: {
        inventory: {
          select: { totalQty: true, reservedQty: true, soldQty: true },
        },
      },
    });

    const enriched = ticketTypes.map((t: any) => ({
      ...t,
      available: t.inventory
        ? t.inventory.totalQty - t.inventory.reservedQty - t.inventory.soldQty
        : 0,
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
}

// ─── Create Ticket Type ────────────────────────────────────────────────
export async function createTicketType(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const eventId = req.params.eventId as string;
    const sellerId = req.user!.userId;

    // Verify seller owns this event
    const event = await prisma.event.findFirst({ where: { id: eventId, sellerId } });
    if (!event) throw createError("Event not found or access denied", 404);

    const {
      name,
      description,
      price,
      originalPrice,
      quantity,
      maxPerOrder = 10,
      saleStart,
      saleEnd,
      color,
      sortOrder = 0,
    } = req.body;

    if (!name || !price || !quantity) {
      throw createError("Name, price and quantity are required", 400, "VALIDATION_ERROR");
    }

    const ticketType = await prisma.$transaction(async (tx) => {
      const tt = await tx.ticketType.create({
        data: {
          eventId,
          name,
          description,
          price,
          originalPrice,
          quantity,
          maxPerOrder,
          saleStart: saleStart ? new Date(saleStart) : null,
          saleEnd: saleEnd ? new Date(saleEnd) : null,
          color,
          sortOrder,
        },
      });

      // Create inventory record
      await tx.ticketInventory.create({
        data: {
          ticketTypeId: tt.id,
          totalQty: quantity,
        },
      });

      return tt;
    });

    res.status(201).json({ success: true, data: ticketType });
  } catch (err) {
    next(err);
  }
}

// ─── Update Ticket Type ────────────────────────────────────────────────
export async function updateTicketType(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const eventId = req.params.eventId as string;
    const ticketId = req.params.ticketId as string;
    const sellerId = req.user!.userId;

    const event = await prisma.event.findFirst({ where: { id: eventId, sellerId } });
    if (!event) throw createError("Access denied", 403);

    const existing = await prisma.ticketType.findFirst({
      where: { id: ticketId, eventId },
      include: { inventory: true },
    });
    if (!existing) throw createError("Ticket type not found", 404);

    const { name, description, price, originalPrice, quantity, maxPerOrder, saleStart, saleEnd, status, color, sortOrder } =
      req.body;

    const updated = await prisma.$transaction(async (tx) => {
      const tt = await tx.ticketType.update({
        where: { id: ticketId },
        data: { name, description, price, originalPrice, quantity, maxPerOrder, saleStart, saleEnd, status, color, sortOrder },
      });

      // Sync inventory totalQty if quantity changed
      if (quantity && (existing as any).inventory) {
        const diff = quantity - existing.quantity;
        await tx.ticketInventory.update({
          where: { ticketTypeId: ticketId },
          data: { totalQty: { increment: diff } },
        });
      }

      return tt;
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// ─── Delete Ticket Type ────────────────────────────────────────────────
export async function deleteTicketType(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const eventId = req.params.eventId as string;
    const ticketId = req.params.ticketId as string;
    const sellerId = req.user!.userId;

    const event = await prisma.event.findFirst({ where: { id: eventId, sellerId } });
    if (!event) throw createError("Access denied", 403);

    await prisma.ticketType.delete({ where: { id: ticketId } });
    res.json({ success: true, message: "Ticket type deleted" });
  } catch (err) {
    next(err);
  }
}
