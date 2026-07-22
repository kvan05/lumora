import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { createError } from "../middleware/errorHandler";

const getSellerId = (req: Request) => req.user!.userId;

// ─── Dashboard Overview ─────────────────────────────────────────────────
export async function getDashboard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sellerId = getSellerId(req);

    const [
      totalEvents,
      publishedEvents,
      totalOrders,
      revenue,
      recentOrders,
    ] = await Promise.all([
      prisma.event.count({ where: { sellerId } }),
      prisma.event.count({ where: { sellerId, status: "PUBLISHED" } }),
      prisma.order.count({
        where: { event: { sellerId }, status: "CONFIRMED" },
      }),
      prisma.order.aggregate({
        where: { event: { sellerId }, status: "CONFIRMED" },
        _sum: { total: true },
      }),
      prisma.order.findMany({
        where: { event: { sellerId } },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          event: { select: { title: true } },
          buyer: { select: { name: true, email: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalEvents,
          publishedEvents,
          totalOrders,
          totalRevenue: revenue._sum.total || 0,
        },
        recentOrders,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Seller's Events ────────────────────────────────────────────────────
export async function getSellerEvents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const { page = "1", limit = "10", status } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = { sellerId, ...(status && { status }) };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        include: {
          ticketTypes: {
            include: { inventory: true },
          },
          _count: { select: { orders: true } },
        },
      }),
      prisma.event.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        events,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Seller's Orders ────────────────────────────────────────────────────
export async function getSellerOrders(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const { page = "1", limit = "20", status, eventId } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {
      event: { sellerId },
      ...(status && { status }),
      ...(eventId && { eventId }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          event: { select: { id: true, title: true } },
          items: { include: { ticketType: { select: { name: true } }, seat: { select: { seatLabel: true } } } },
          payment: { select: { status: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Order Detail ───────────────────────────────────────────────────────
export async function getSellerOrderDetail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orderId = req.params.orderId as string;
    const sellerId = getSellerId(req);

    const order = await prisma.order.findFirst({
      where: { id: orderId, event: { sellerId } },
      include: {
        buyer: true,
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

// ─── Check-in Order (all items) ─────────────────────────────────────────
export async function checkInOrder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orderId = req.params.orderId as string;
    const sellerId = getSellerId(req);

    const order = await prisma.order.findFirst({
      where: { id: orderId, event: { sellerId }, status: "CONFIRMED" },
    });
    if (!order) throw createError("Order not found or not confirmed", 404);

    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: "CHECKED_IN", checkedInAt: new Date() },
      }),
      prisma.orderItem.updateMany({
        where: { orderId },
        data: { isCheckedIn: true, checkedInAt: new Date() },
      }),
    ]);

    res.json({ success: true, message: "Check-in successful" });
  } catch (err) {
    next(err);
  }
}

// ─── Check-in Single Item (by ticket code) ──────────────────────────────
export async function checkInItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const itemId = req.params.itemId as string;
    const sellerId = getSellerId(req);

    const item = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
        order: { event: { sellerId }, status: "CONFIRMED" },
        isCheckedIn: false,
      },
    });
    if (!item) throw createError("Ticket not found, already checked in, or access denied", 404);

    await prisma.orderItem.update({
      where: { id: itemId },
      data: { isCheckedIn: true, checkedInAt: new Date() },
    });

    res.json({ success: true, message: "Ticket checked in" });
  } catch (err) {
    next(err);
  }
}

// ─── Analytics ─────────────────────────────────────────────────────────
export async function getAnalytics(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const { eventId, period = "30d" } = req.query as Record<string, string>;

    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const where: any = {
      event: { sellerId },
      status: "CONFIRMED",
      confirmedAt: { gte: since },
      ...(eventId && { eventId }),
    };

    // Daily revenue aggregation
    const orders = await prisma.order.findMany({
      where,
      select: { total: true, confirmedAt: true, eventId: true },
      orderBy: { confirmedAt: "asc" },
    });

    // Group by day
    const revenueByDay: Record<string, number> = {};
    for (const order of orders) {
      if (!order.confirmedAt) continue;
      const day = order.confirmedAt.toISOString().split("T")[0];
      revenueByDay[day] = (revenueByDay[day] || 0) + Number(order.total);
    }

    // Top events by revenue
    const topEvents = await prisma.order.groupBy({
      by: ["eventId"],
      where: { event: { sellerId }, status: "CONFIRMED" },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    });

    res.json({
      success: true,
      data: {
        revenueByDay: Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue })),
        topEvents,
        totalRevenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
        totalOrders: orders.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Customer List ──────────────────────────────────────────────────────
export async function getCustomers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const { page = "1", limit = "20" } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const buyers = await prisma.user.findMany({
      where: {
        orders: { some: { event: { sellerId }, status: "CONFIRMED" } },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        orders: {
          where: { event: { sellerId }, status: "CONFIRMED" },
          select: { total: true },
        },
      },
      skip,
      take: parseInt(limit),
    });

    res.json({
      success: true,
      data: buyers.map((b) => ({
        ...b,
        totalSpent: b.orders.reduce((sum, o) => sum + Number(o.total), 0),
        orderCount: b.orders.length,
        orders: undefined,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// ─── Export Report (CSV for now) ────────────────────────────────────────
export async function exportReport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const { eventId, format = "csv" } = req.query as Record<string, string>;

    const orders = await prisma.order.findMany({
      where: {
        event: { sellerId },
        status: "CONFIRMED",
        ...(eventId && { eventId }),
      },
      include: {
        buyer: { select: { name: true, email: true, phone: true } },
        event: { select: { title: true, startDate: true } },
        items: { include: { ticketType: { select: { name: true } }, seat: { select: { seatLabel: true } } } },
      },
      orderBy: { confirmedAt: "desc" },
    });

    if (format === "csv") {
      const headers = ["Order #", "Event", "Date", "Buyer", "Email", "Phone", "Tickets", "Total (VND)", "Confirmed At"];
      const rows = orders.map((o) => [
        o.orderNumber,
        o.event.title,
        new Date(o.event.startDate).toLocaleDateString("vi-VN"),
        o.buyer.name || "",
        o.buyer.email,
        o.buyer.phone || "",
        o.items.map((i) => i.ticketType?.name || i.seat?.seatLabel || "Ticket").join("; "),
        Number(o.total).toLocaleString("vi-VN"),
        o.confirmedAt?.toLocaleString("vi-VN") || "",
      ]);

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=lumora-report-${Date.now()}.csv`);
      res.send("\uFEFF" + csv); // BOM for Excel UTF-8
    } else {
      res.json({ success: true, data: orders });
    }
  } catch (err) {
    next(err);
  }
}
