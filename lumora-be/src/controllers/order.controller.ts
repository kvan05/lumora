import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { createError } from "../middleware/errorHandler";
import { generateOrderNumber, generateTicketCode } from "../utils/orderUtils";
import { getSocketIO } from "../socket";

export interface OrderItemInput {
  ticketTypeId?: string;
  seatId?: string;
  quantity: number;
}

// ─── Create Order ───────────────────────────────────────────────────────
export async function createOrder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const buyerId = req.user!.userId;
    const { eventId, items }: { eventId: string; items: OrderItemInput[] } = req.body;

    if (!eventId || !items?.length) {
      throw createError("eventId and items are required", 400, "VALIDATION_ERROR");
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId, status: "PUBLISHED" },
    });
    if (!event) throw createError("Event not found or not available", 404);

    // ── Atomic transaction: check availability + reserve ────────────────
    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItems: any[] = [];

      for (const item of items) {
        // ── Seat-based booking ──
        if (item.seatId) {
          const seat = await tx.seat.findUnique({
            where: { id: item.seatId },
            include: { row: { include: { section: true } } },
          });

          if (!seat || seat.status !== "AVAILABLE") {
            throw createError(`Seat ${seat?.seatLabel || item.seatId} is no longer available`, 409, "SEAT_UNAVAILABLE");
          }

          const price = Number(seat.row.section.price);
          subtotal += price;

          // Reserve the seat
          await tx.seat.update({
            where: { id: item.seatId },
            data: {
              status: "RESERVED",
              reservedBy: buyerId,
              reservedAt: new Date(),
              expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            },
          });

          orderItems.push({
            seatId: item.seatId,
            quantity: 1,
            unitPrice: price,
            subtotal: price,
            ticketCode: generateTicketCode(),
          });
        }

        // ── Ticket-type booking ──
        if (item.ticketTypeId) {
          const ticketType = await tx.ticketType.findUnique({
            where: { id: item.ticketTypeId },
            include: { inventory: true },
          });

          if (!ticketType || ticketType.status !== "ACTIVE") {
            throw createError(`Ticket type not available`, 409, "TICKET_UNAVAILABLE");
          }

          const inv = ticketType.inventory;
          if (!inv) throw createError("Inventory not found", 500);

          const available = inv.totalQty - inv.reservedQty - inv.soldQty;
          if (available < item.quantity) {
            throw createError(
              `Only ${available} tickets available for "${ticketType.name}"`,
              409,
              "INSUFFICIENT_INVENTORY"
            );
          }

          // Max per order check
          if (item.quantity > ticketType.maxPerOrder) {
            throw createError(
              `Max ${ticketType.maxPerOrder} tickets per order for "${ticketType.name}"`,
              400,
              "MAX_PER_ORDER"
            );
          }

          const lineTotal = Number(ticketType.price) * item.quantity;
          subtotal += lineTotal;

          // Atomically increment reserved quantity
          await tx.ticketInventory.update({
            where: { ticketTypeId: item.ticketTypeId },
            data: { reservedQty: { increment: item.quantity } },
          });

          // Create one item per ticket for individual QR codes
          for (let i = 0; i < item.quantity; i++) {
            orderItems.push({
              ticketTypeId: item.ticketTypeId,
              quantity: 1,
              unitPrice: ticketType.price,
              subtotal: ticketType.price,
              ticketCode: generateTicketCode(),
            });
          }
        }
      }

      const serviceFee = Math.round(subtotal * 0.02); // 2% service fee
      const total = subtotal + serviceFee;

      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          buyerId,
          eventId,
          subtotal,
          fees: serviceFee,
          total,
          currency: "VND",
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          items: { create: orderItems },
        },
        include: {
          items: { include: { ticketType: true, seat: true } },
          event: { select: { id: true, title: true, startDate: true, venue: true } },
        },
      });

      return newOrder;
    });

    // Broadcast inventory update via Socket.io
    const io = getSocketIO();
    io.to(`event:${eventId}`).emit("inventory:update", {
      eventId,
      items: items.map((i) => ({ ticketTypeId: i.ticketTypeId, seatId: i.seatId })),
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

// ─── Get My Orders ──────────────────────────────────────────────────────
export async function getMyOrders(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const buyerId = req.user!.userId;
    const { page = "1", limit = "10", status } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = { buyerId, ...(status && { status }) };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        include: {
          event: { select: { id: true, title: true, slug: true, bannerUrl: true, startDate: true, venue: true, city: true } },
          items: { include: { ticketType: { select: { name: true } }, seat: true } },
          payment: { select: { status: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Get Order by ID ────────────────────────────────────────────────────
export async function getOrderById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const buyerId = req.user!.userId;

    const order = await prisma.order.findFirst({
      where: { id, buyerId },
      include: {
        event: true,
        items: { include: { ticketType: true, seat: { include: { row: { include: { section: true } } } } } },
        payment: true,
      },
    });

    if (!order) throw createError("Order not found", 404);

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

// ─── Cancel Order ────────────────────────────────────────────────────────
export async function cancelOrder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const buyerId = req.user!.userId;

    const order = await prisma.order.findFirst({
      where: { id, buyerId },
      include: { items: true },
    });

    if (!order) throw createError("Order not found", 404);
    if (!["PENDING"].includes(order.status)) {
      throw createError("Only pending orders can be cancelled", 400, "INVALID_STATUS");
    }

    await releaseInventory(order.items, order.id);

    res.json({ success: true, message: "Order cancelled successfully" });
  } catch (err) {
    next(err);
  }
}

// ─── Release inventory (used by cancel and timeout job) ─────────────────
export async function releaseInventory(
  items: any[],
  orderId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      if (item.seatId) {
        await tx.seat.update({
          where: { id: item.seatId },
          data: { status: "AVAILABLE", reservedBy: null, reservedAt: null, expiresAt: null },
        });
      }
      if (item.ticketTypeId) {
        await tx.ticketInventory.update({
          where: { ticketTypeId: item.ticketTypeId },
          data: { reservedQty: { decrement: 1 } },
        });
      }
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });
  });
}
