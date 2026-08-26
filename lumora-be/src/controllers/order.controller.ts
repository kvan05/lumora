import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { createError } from "../middleware/errorHandler";
import { generateOrderNumber, generateTicketCode } from "../utils/orderUtils";
import { getSocketIO } from "../socket";
import { computeEventExpiry } from "../utils/eventStatus";

export interface OrderItemInput {
  ticketTypeId?: string;
  seatId?: string;
  quantity: number;
  eventDate?: string; // ISO date string for multi-day events (e.g. "2026-08-29")
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
      where: { id: eventId },
    });
    if (!event) throw createError("Sự kiện không tồn tại", 404);
    if (event.status === "PAUSED") {
      throw createError("Sự kiện này hiện đang ngưng bán vé.", 400, "EVENT_PAUSED");
    }
    if (event.status !== "PUBLISHED") {
      throw createError("Sự kiện hiện không khả dụng để đặt vé", 400, "EVENT_NOT_AVAILABLE");
    }

    // ── Check event expiry ──────────────────────────────────────────────
    const expiry = computeEventExpiry(event.endDate);
    if (!expiry.canPurchase) {
      throw createError("Sự kiện này đã kết thúc, không thể tiếp tục đặt vé.", 400, "EVENT_ENDED");
    }

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
            ...(item.eventDate && { eventDate: new Date(item.eventDate) }),
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
              // Save the selected event date for multi-day events
              ...(item.eventDate && { eventDate: new Date(item.eventDate) }),
            });
          }
        }
      }

      const serviceFee = 0; // Phí dịch vụ cho khách hàng = 0đ (phí dịch vụ 2%-5% sẽ khấu trừ từ doanh thu nhà cung cấp Seller khi đối soát)
      const total = subtotal;

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
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            bannerUrl: true,
            startDate: true,
            endDate: true,
            venue: true,
            city: true,
            category: true,
          },
        },
        buyer: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            ticketType: { select: { id: true, name: true, price: true } },
            seat: {
              include: {
                row: { include: { section: { select: { id: true, name: true } } } },
              },
            },
          },
        },
        payment: true,
        RefundRequest: true,
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
      throw createError("Chỉ có thể hủy đơn hàng đang chờ thanh toán", 400, "INVALID_STATUS");
    }

    await releaseInventory(order.items, order.id, order.eventId);

    res.json({ success: true, message: "Đã hủy đơn hàng và nhả ghế/vé thành công" });
  } catch (err) {
    next(err);
  }
}

// ─── Release inventory (used by cancel, failure and timeout job) ─────────
export async function releaseInventory(
  items: any[],
  orderId: string,
  eventId?: string
): Promise<void> {
  const seatIds: string[] = [];
  const ticketTypeCounts: Record<string, number> = {};

  for (const item of items) {
    if (item.seatId) {
      seatIds.push(item.seatId);
    }
    if (item.ticketTypeId) {
      ticketTypeCounts[item.ticketTypeId] = (ticketTypeCounts[item.ticketTypeId] || 0) + 1;
    }
  }

  let resolvedEventId = eventId;

  await prisma.$transaction(async (tx) => {
    // 1. Release seats
    if (seatIds.length > 0) {
      await tx.seat.updateMany({
        where: { id: { in: seatIds } },
        data: {
          status: "AVAILABLE",
          reservedBy: null,
          reservedAt: null,
          expiresAt: null,
        },
      });
    }

    // 2. Decrement reservedQty for ticket inventories safely
    for (const [ttId, qty] of Object.entries(ticketTypeCounts)) {
      const inv = await tx.ticketInventory.findUnique({
        where: { ticketTypeId: ttId },
      });
      if (inv) {
        const newReserved = Math.max(0, inv.reservedQty - qty);
        await tx.ticketInventory.update({
          where: { ticketTypeId: ttId },
          data: { reservedQty: newReserved },
        });
      }
    }

    // 3. Update Order status
    if (orderId) {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
        select: { eventId: true, orderNumber: true },
      });
      if (!resolvedEventId) {
        resolvedEventId = updatedOrder.eventId;
      }
    }

    // 4. Update Payment if exists and still PENDING
    if (orderId) {
      await tx.payment.updateMany({
        where: { orderId, status: "PENDING" },
        data: { status: "FAILED" },
      });
    }
  });

  console.log(`[Inventory] 🔄 Released inventory for Order ${orderId} (Seats: [${seatIds.join(", ")}], Tickets: ${JSON.stringify(ticketTypeCounts)})`);

  // 5. Broadcast Socket.io realtime updates to event room
  if (resolvedEventId) {
    try {
      const io = getSocketIO();
      io.to(`event:${resolvedEventId}`).emit("inventory:update", {
        eventId: resolvedEventId,
        reason: "inventory_released",
        releasedSeats: seatIds,
      });
      io.to(`event:${resolvedEventId}`).emit("seats:update", {
        eventId: resolvedEventId,
        releasedSeats: seatIds,
      });
    } catch (e) {
      console.warn("[Inventory] Socket emit failed:", e);
    }
  }
}

// ─── Clean up expired reservations (Passive & Scheduled) ─────────────────
export async function cleanupExpiredReservations(
  targetEventId?: string
): Promise<{ releasedOrders: number; releasedSeats: number }> {
  const now = new Date();
  let totalOrdersReleased = 0;
  let totalSeatsReleased = 0;

  try {
    // 1. Find and release expired PENDING orders
    const orderWhere: any = {
      status: "PENDING",
      expiresAt: { lt: now },
      ...(targetEventId && { eventId: targetEventId }),
    };

    const expiredOrders = await prisma.order.findMany({
      where: orderWhere,
      include: { items: true },
      take: 100,
    });

    for (const order of expiredOrders) {
      try {
        await releaseInventory(order.items, order.id, order.eventId);
        totalOrdersReleased++;
      } catch (err) {
        console.error(`[Cleanup] Error releasing expired order ${order.id}:`, err);
      }
    }

    // 2. Find and reset any orphaned RESERVED seats past expiresAt
    const seatWhere: any = {
      status: "RESERVED",
      expiresAt: { lt: now },
      ...(targetEventId && {
        row: { section: { eventId: targetEventId } },
      }),
    };

    const orphanedSeats = await prisma.seat.findMany({
      where: seatWhere,
      select: { id: true, row: { select: { section: { select: { eventId: true } } } } },
      take: 200,
    });

    if (orphanedSeats.length > 0) {
      const seatIds = orphanedSeats.map((s) => s.id);
      await prisma.seat.updateMany({
        where: { id: { in: seatIds } },
        data: {
          status: "AVAILABLE",
          reservedBy: null,
          reservedAt: null,
          expiresAt: null,
        },
      });

      totalSeatsReleased += seatIds.length;
      console.log(`[Cleanup] 🪑 Freed ${seatIds.length} orphaned reserved seats.`);

      // Group by eventId and emit socket
      const eventIds = new Set(orphanedSeats.map((s) => s.row.section.eventId));
      try {
        const io = getSocketIO();
        for (const eId of eventIds) {
          io.to(`event:${eId}`).emit("inventory:update", {
            eventId: eId,
            reason: "expired_seats_cleared",
          });
          io.to(`event:${eId}`).emit("seats:update", { eventId: eId });
        }
      } catch (e) {
        console.warn("[Cleanup] Socket emit failed:", e);
      }
    }
  } catch (err) {
    console.error("[Cleanup] Error during expired reservations cleanup:", err);
  }

  return { releasedOrders: totalOrdersReleased, releasedSeats: totalSeatsReleased };
}

// ─── Apply Voucher ────────────────────────────────────────────────────────
export async function applyVoucher(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const buyerId = req.user!.userId;
    const { code } = req.body;

    if (!code) throw createError("Voucher code is required", 400);

    const order = await prisma.order.findFirst({
      where: { id, buyerId },
    });

    if (!order) throw createError("Order not found", 404);
    if (order.status !== "PENDING") {
      throw createError("Cannot apply voucher to a non-pending order", 400);
    }
    if (order.voucherCode) {
      throw createError("Voucher already applied to this order", 400);
    }

    const voucher = await prisma.voucher.findUnique({
      where: { code },
    });

    if (!voucher || voucher.status !== "ACTIVE" || new Date() < voucher.startDate || new Date() > voucher.endDate) {
      throw createError("Invalid or expired voucher", 400, "INVALID_VOUCHER");
    }

    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
      throw createError("Voucher usage limit reached", 400, "VOUCHER_LIMIT_REACHED");
    }

    if (voucher.minOrderValue && Number(order.subtotal) < Number(voucher.minOrderValue)) {
      throw createError(`Minimum order value is ${Number(voucher.minOrderValue).toLocaleString("vi-VN")} ₫`, 400);
    }

    // Calculate discount
    let discount = 0;
    if (voucher.discountType === "FIXED") {
      discount = Number(voucher.discountValue);
    } else if (voucher.discountType === "PERCENTAGE") {
      discount = (Number(order.subtotal) * Number(voucher.discountValue)) / 100;
      if (voucher.maxDiscount && discount > Number(voucher.maxDiscount)) {
        discount = Number(voucher.maxDiscount);
      }
    }

    // Never discount more than subtotal
    if (discount > Number(order.subtotal)) {
      discount = Number(order.subtotal);
    }

    const newTotal = Number(order.subtotal) + Number(order.fees) - discount;

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        discount: discount,
        total: newTotal > 0 ? newTotal : 0,
        voucherCode: voucher.code,
      },
      include: {
        event: true,
        items: { include: { ticketType: true, seat: { include: { row: { include: { section: true } } } } } },
      }
    });

    res.json({ success: true, data: updatedOrder, message: "Áp dụng mã giảm giá thành công" });
  } catch (err) {
    next(err);
  }
}

// ─── Request Refund ───────────────────────────────────────────────────────
export async function requestRefund(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const buyerId = req.user!.userId;
    const { reason } = req.body;

    if (!reason) throw createError("Vui lòng nhập lý do hoàn tiền", 400);

    const order = await prisma.order.findFirst({
      where: { id, buyerId },
      include: { RefundRequest: true },
    });

    if (!order) throw createError("Order not found", 404);
    if (!["CONFIRMED", "CHECKED_IN"].includes(order.status)) {
      throw createError("Chỉ có thể yêu cầu hoàn tiền cho đơn hàng đã thanh toán", 400);
    }
    if (order.RefundRequest) {
      throw createError("Đơn hàng này đã có yêu cầu hoàn tiền", 400);
    }

    const refund = await prisma.refundRequest.create({
      data: {
        orderId: order.id,
        userId: buyerId,
        reason,
        amount: order.total,
      },
    });

    res.status(201).json({
      success: true,
      data: refund,
      message: "Yêu cầu hoàn tiền đã được gửi. Ban quản trị sẽ xử lý sớm nhất.",
    });
  } catch (err) {
    next(err);
  }
}

