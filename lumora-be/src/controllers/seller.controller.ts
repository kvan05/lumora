import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { createError } from "../middleware/errorHandler";
import { createNotification, createRoleNotification } from "./notification.controller";

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
    const {
      page = "1",
      limit = "20",
      search,
      status,
      eventId,
      period,
      startDate,
      endDate,
      ticketTypeId,
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 20);
    const skip = (pageNum - 1) * limitNum;

    // 1. Date filter construction
    let dateFilter: any = {};
    const now = new Date();
    if (period === "today") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = { gte: startOfDay };
    } else if (period === "7d") {
      dateFilter = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (period === "30d") {
      dateFilter = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    } else if (period === "custom") {
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
    }

    // Parse eventId array if passed (comma-separated)
    const eventIdsArray = eventId ? eventId.split(",").map(e => e.trim()).filter(Boolean) : [];

    // 2. Build Prisma order query filter
    const where: any = {
      event: { sellerId },
      ...(status && status !== "ALL" && { status }),
      ...(eventIdsArray.length > 0 && { eventId: { in: eventIdsArray } }),
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      ...(ticketTypeId && ticketTypeId !== "ALL" && { items: { some: { ticketTypeId } } }),
    };

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { id: { contains: q, mode: "insensitive" } },
        { orderNumber: { contains: q, mode: "insensitive" } },
        { buyer: { name: { contains: q, mode: "insensitive" } } },
        { buyer: { email: { contains: q, mode: "insensitive" } } },
        { buyer: { phone: { contains: q, mode: "insensitive" } } },
        { event: { title: { contains: q, mode: "insensitive" } } },
      ];
    }

    // 3. Fetch orders, count, and seller events for dropdown options
    const [orders, total, sellerEvents] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          buyer: { select: { id: true, name: true, email: true, phone: true } },
          event: { select: { id: true, title: true, bannerUrl: true, category: true, venue: true, city: true, startDate: true } },
          items: {
            include: {
              ticketType: { select: { id: true, name: true, price: true } },
              seat: { select: { id: true, seatLabel: true } },
            },
          },
          payment: { select: { status: true } },
        },
      }),
      prisma.order.count({ where }),
      prisma.event.findMany({
        where: { sellerId },
        select: {
          id: true,
          title: true,
          ticketTypes: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const sellerEventsList = sellerEvents.map(e => ({ id: e.id, title: e.title }));
    const ticketTypesList: Array<{ id: string; name: string }> = [];
    sellerEvents.forEach(e => {
      e.ticketTypes.forEach(tt => {
        ticketTypesList.push({ id: tt.id, name: `${tt.name} (${e.title})` });
      });
    });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
        filterOptions: {
          events: sellerEventsList,
          ticketTypes: ticketTypesList,
        },
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

// ─── Check-in Single Item (by QR code/ticket code/id) ───────────────────
export async function checkInItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const itemId = req.params.itemId as string;
    const sellerId = getSellerId(req);
    const cleanCode = itemId?.trim();

    if (!cleanCode) {
      throw createError("Mã vé không được để trống", 400);
    }

    const item = await prisma.orderItem.findFirst({
      where: {
        OR: [
          { ticketCode: cleanCode },
          { id: cleanCode },
        ],
        order: {
          event: { sellerId },
        },
      },
      include: {
        order: {
          include: {
            buyer: { select: { id: true, name: true, email: true, phone: true } },
            event: { select: { id: true, title: true, bannerUrl: true, category: true, venue: true, city: true, startDate: true } },
          },
        },
        ticketType: { select: { id: true, name: true, price: true } },
        seat: { select: { id: true, seatLabel: true } },
      },
    });

    if (!item) {
      throw createError("Không tìm thấy vé hoặc vé không thuộc quyền quản lý của bạn", 404);
    }

    if (item.order.status === "REFUNDED" || item.order.status === "CANCELLED") {
      throw createError(`Vé này đã bị hủy hoặc hoàn tiền (Trạng thái đơn: ${item.order.status})`, 400);
    }

    if (!["CONFIRMED", "PAID"].includes(item.order.status)) {
      throw createError(`Đơn hàng chưa thanh toán thành công (Trạng thái: ${item.order.status})`, 400);
    }

    const ticketDetail = {
      id: item.id,
      ticketCode: item.ticketCode || item.id,
      orderNumber: item.order.orderNumber,
      eventTitle: item.order.event.title,
      bannerUrl: item.order.event.bannerUrl,
      category: item.order.event.category,
      venue: item.order.event.venue,
      city: item.order.event.city,
      startDate: item.order.event.startDate,
      buyerName: item.order.buyer.name || item.order.buyer.email,
      buyerEmail: item.order.buyer.email,
      buyerPhone: item.order.buyer.phone,
      ticketType: item.ticketType?.name || (item.seat ? `Ghế ${item.seat.seatLabel}` : "Vé Khách Hàng"),
      seatLabel: item.seat?.seatLabel || null,
      isCheckedIn: item.isCheckedIn,
      checkedInAt: item.checkedInAt,
    };

    // If ALREADY checked in
    if (item.isCheckedIn) {
      const formattedTime = item.checkedInAt ? new Date(item.checkedInAt).toLocaleString("vi-VN") : "";
      res.json({
        success: true,
        alreadyCheckedIn: true,
        message: `Vé này ĐÃ ĐƯỢC CHECK-IN trước đó${formattedTime ? ` (lúc ${formattedTime})` : ""}!`,
        data: ticketDetail,
      });
      return;
    }

    // Process Check-in
    const now = new Date();
    await prisma.orderItem.update({
      where: { id: item.id },
      data: { isCheckedIn: true, checkedInAt: now },
    });

    res.json({
      success: true,
      alreadyCheckedIn: false,
      message: "Check-in vé thành công!",
      data: {
        ...ticketDetail,
        isCheckedIn: true,
        checkedInAt: now,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Verify Seller Checkin Ticket (POST /api/seller/checkin/verify) ─────
export async function verifySellerCheckinTicket(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  req.params.itemId = req.body.ticketCode || req.body.code || req.body.itemId || "";
  return checkInItem(req, res, next);
}

// ─── Get Seller Check-in Stats ──────────────────────────────────────────
export async function getSellerCheckinStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const { eventId } = req.query as Record<string, string>;

    const orderWhere: any = {
      event: { sellerId },
      status: { in: ["CONFIRMED", "PAID"] },
      ...(eventId ? { eventId } : {}),
    };

    const [totalTickets, checkedInCount] = await Promise.all([
      prisma.orderItem.count({
        where: { order: orderWhere },
      }),
      prisma.orderItem.count({
        where: {
          order: orderWhere,
          isCheckedIn: true,
        },
      }),
    ]);

    const uncheckedCount = Math.max(0, totalTickets - checkedInCount);
    const checkinRate = totalTickets > 0 ? Math.round((checkedInCount / totalTickets) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalTickets,
        checkedInCount,
        uncheckedCount,
        checkinRate,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Get Seller Check-in Tickets (Attendee List) ─────────────────────────
export async function getSellerCheckinTickets(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const { eventId, search, isCheckedIn } = req.query as Record<string, string>;

    const where: any = {
      order: {
        event: { sellerId },
        status: { in: ["CONFIRMED", "PAID"] },
        ...(eventId ? { eventId } : {}),
      },
    };

    if (isCheckedIn !== undefined && isCheckedIn !== "") {
      where.isCheckedIn = isCheckedIn === "true";
    }

    if (search && search.trim()) {
      const query = search.trim();
      where.OR = [
        { ticketCode: { contains: query, mode: "insensitive" } },
        { id: { contains: query, mode: "insensitive" } },
        { order: { orderNumber: { contains: query, mode: "insensitive" } } },
        { order: { buyer: { name: { contains: query, mode: "insensitive" } } } },
        { order: { buyer: { email: { contains: query, mode: "insensitive" } } } },
        { order: { buyer: { phone: { contains: query, mode: "insensitive" } } } },
      ];
    }

    const items = await prisma.orderItem.findMany({
      where,
      take: 200,
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          include: {
            buyer: { select: { id: true, name: true, email: true, phone: true } },
            event: { select: { id: true, title: true, venue: true, city: true, startDate: true } },
          },
        },
        ticketType: { select: { id: true, name: true, price: true } },
        seat: { select: { id: true, seatLabel: true } },
      },
    });

    const tickets = items.map((item) => ({
      id: item.id,
      ticketCode: item.ticketCode || item.id,
      orderId: item.orderId,
      orderNumber: item.order.orderNumber,
      eventId: item.order.event.id,
      eventTitle: item.order.event.title,
      venue: item.order.event.venue,
      city: item.order.event.city,
      startDate: item.order.event.startDate,
      buyerId: item.order.buyer.id,
      buyerName: item.order.buyer.name || item.order.buyer.email,
      buyerEmail: item.order.buyer.email,
      buyerPhone: item.order.buyer.phone || null,
      ticketType: item.ticketType?.name || (item.seat ? `Ghế ${item.seat.seatLabel}` : "Vé Khách Hàng"),
      seatLabel: item.seat?.seatLabel || null,
      price: Number(item.unitPrice),
      quantity: item.quantity,
      isCheckedIn: item.isCheckedIn,
      checkedInAt: item.checkedInAt,
      createdAt: item.createdAt,
    }));

    res.json({ success: true, data: tickets });
  } catch (err) {
    next(err);
  }
}


// ─── Analytics ─────────────────────────────────────────────────────────
// ─── Analytics ─────────────────────────────────────────────────────────
export async function getAnalytics(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const { period = "30d", startDate, endDate, eventId, ticketTypeId } = req.query as Record<string, string>;

    // 1. Build date range filter
    let dateFilter: any = {};
    if (period === "7d") {
      dateFilter = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (period === "30d") {
      dateFilter = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    } else if (period === "90d") {
      dateFilter = { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
    } else if (period === "custom") {
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
    }

    // Parse eventId array if passed (comma-separated)
    const eventIdsArray = eventId ? eventId.split(",").map(e => e.trim()).filter(Boolean) : [];

    // 2. Fetch seller's events and ticket types list for filter options
    const sellerEvents = await prisma.event.findMany({
      where: { sellerId },
      select: {
        id: true,
        title: true,
        category: true,
        startDate: true,
        ticketTypes: { select: { id: true, name: true, quantity: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const sellerEventsList = sellerEvents.map(e => ({ id: e.id, title: e.title }));
    const ticketTypesList: Array<{ id: string; name: string }> = [];
    sellerEvents.forEach(e => {
      e.ticketTypes.forEach(tt => {
        ticketTypesList.push({ id: tt.id, name: `${tt.name} - ${e.title}` });
      });
    });

    // 3. Build Order query filter
    const orderWhere: any = {
      event: { sellerId },
      status: { in: ["CONFIRMED", "CHECKED_IN"] },
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      ...(eventIdsArray.length > 0 && { eventId: { in: eventIdsArray } }),
      ...(ticketTypeId && { items: { some: { ticketTypeId } } }),
    };

    // 4. Fetch matching orders with items
    const orders = await prisma.order.findMany({
      where: orderWhere,
      include: {
        event: { select: { id: true, title: true } },
        items: {
          include: {
            ticketType: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 5. Aggregate overall summary stats
    let totalRevenue = 0;
    let totalTicketsSold = 0;
    let totalCheckedIn = 0;

    const revenueByDayMap: Record<string, { revenue: number; ticketsCount: number; ordersCount: number }> = {};
    const revenueByEventMap: Record<string, { eventId: string; eventTitle: string; revenue: number; ticketsCount: number; checkedInCount: number }> = {};

    for (const order of orders) {
      const orderTotal = Number(order.total || 0);
      totalRevenue += orderTotal;

      const dayKey = order.createdAt.toISOString().split("T")[0];
      if (!revenueByDayMap[dayKey]) {
        revenueByDayMap[dayKey] = { revenue: 0, ticketsCount: 0, ordersCount: 0 };
      }
      revenueByDayMap[dayKey].revenue += orderTotal;
      revenueByDayMap[dayKey].ordersCount += 1;

      const evtId = order.eventId;
      const evtTitle = order.event?.title || "Sự kiện";
      if (!revenueByEventMap[evtId]) {
        revenueByEventMap[evtId] = { eventId: evtId, eventTitle: evtTitle, revenue: 0, ticketsCount: 0, checkedInCount: 0 };
      }
      revenueByEventMap[evtId].revenue += orderTotal;

      for (const item of order.items) {
        // Skip item if filtering by specific ticketTypeId and it doesn't match
        if (ticketTypeId && item.ticketTypeId !== ticketTypeId) continue;

        const qty = item.quantity || 1;
        totalTicketsSold += qty;
        revenueByDayMap[dayKey].ticketsCount += qty;
        revenueByEventMap[evtId].ticketsCount += qty;

        if (item.isCheckedIn) {
          totalCheckedIn += qty;
          revenueByEventMap[evtId].checkedInCount += qty;
        }
      }
    }

    const checkInRate = totalTicketsSold > 0 ? Number(((totalCheckedIn / totalTicketsSold) * 100).toFixed(1)) : 0;

    // Format revenueByDay
    const revenueByDay = Object.entries(revenueByDayMap).map(([date, val]) => ({
      date,
      revenue: val.revenue,
      ticketsCount: val.ticketsCount,
      ordersCount: val.ordersCount,
    }));

    // Format revenueByEvent
    const revenueByEvent = Object.values(revenueByEventMap).map(item => ({
      eventId: item.eventId,
      eventTitle: item.eventTitle,
      revenue: item.revenue,
      ticketsCount: item.ticketsCount,
      checkedInCount: item.checkedInCount,
    }));

    // 6. Build event-by-event performance table (eventStats)
    const targetEvents = eventIdsArray.length > 0 
      ? sellerEvents.filter(e => eventIdsArray.includes(e.id))
      : sellerEvents;

    const eventStats = targetEvents.map(e => {
      const stats = revenueByEventMap[e.id] || { revenue: 0, ticketsCount: 0, checkedInCount: 0 };
      const totalCapacity = e.ticketTypes.reduce((acc, tt) => acc + (tt.quantity || 0), 0);
      const remainingTickets = Math.max(0, totalCapacity - stats.ticketsCount);

      return {
        eventId: e.id,
        eventTitle: e.title,
        category: e.category,
        startDate: e.startDate,
        ticketsSold: stats.ticketsCount,
        revenue: stats.revenue,
        checkedInCount: stats.checkedInCount,
        totalCapacity,
        remainingTickets,
      };
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrders: orders.length,
          totalTicketsSold,
          totalCheckedIn,
          checkInRate,
        },
        revenueByDay,
        revenueByEvent,
        eventStats,
        sellerEventsList,
        ticketTypesList,
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
    const {
      page = "1",
      limit = "15",
      search,
      eventId,
      segment,
      sortBy = "recent",
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 15);

    // 1. Fetch Stats for all seller's customers
    const [totalCustomersCount, totalRevenueAggregate, allConfirmedOrders] = await Promise.all([
      // Count unique buyers for this seller
      prisma.user.count({
        where: {
          orders: {
            some: {
              event: { sellerId },
              status: { in: ["CONFIRMED", "CHECKED_IN"] },
            },
          },
        },
      }),

      // Aggregate revenue for seller's confirmed orders
      prisma.order.aggregate({
        where: {
          event: { sellerId },
          status: { in: ["CONFIRMED", "CHECKED_IN"] },
        },
        _sum: { total: true },
      }),

      // Fetch all order items count to calculate total tickets sold
      prisma.orderItem.aggregate({
        where: {
          order: {
            event: { sellerId },
            status: { in: ["CONFIRMED", "CHECKED_IN"] },
          },
        },
        _sum: { quantity: true },
      }),
    ]);

    const totalRevenue = Number(totalRevenueAggregate._sum.total || 0);
    const totalTicketsSold = allConfirmedOrders._sum.quantity || 0;
    const avgSpendPerCustomer = totalCustomersCount > 0 ? Math.round(totalRevenue / totalCustomersCount) : 0;

    // 2. Build Where Filter for Buyer Query
    const buyerWhere: any = {
      orders: {
        some: {
          event: { sellerId },
          status: { in: ["CONFIRMED", "CHECKED_IN"] },
          ...(eventId ? { eventId } : {}),
        },
      },
    };

    if (search && search.trim()) {
      const query = search.trim();
      buyerWhere.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ];
    }

    // 3. Fetch Buyers matching criteria
    const rawBuyers = await prisma.user.findMany({
      where: buyerWhere,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        createdAt: true,
        orders: {
          where: {
            event: { sellerId },
            status: { in: ["CONFIRMED", "CHECKED_IN"] },
            ...(eventId ? { eventId } : {}),
          },
          orderBy: { createdAt: "desc" },
          include: {
            event: { select: { id: true, title: true } },
            items: {
              include: {
                ticketType: { select: { id: true, name: true, price: true } },
                seat: { select: { id: true, seatLabel: true } },
              },
            },
          },
        },
      },
    });

    // 4. Process and Aggregate data per Customer
    let processedCustomers = rawBuyers.map((b) => {
      const orders = b.orders || [];
      const totalSpent = orders.reduce((sum, o) => sum + Number(o.total), 0);
      const orderCount = orders.length;

      let totalTickets = 0;
      const eventMap: Record<string, { id: string; title: string; ticketCount: number }> = {};

      orders.forEach((o) => {
        const itemTickets = o.items.reduce((s, i) => s + (i.quantity || 1), 0);
        totalTickets += itemTickets;

        if (o.event) {
          if (!eventMap[o.event.id]) {
            eventMap[o.event.id] = { id: o.event.id, title: o.event.title, ticketCount: 0 };
          }
          eventMap[o.event.id].ticketCount += itemTickets;
        }
      });

      const eventsList = Object.values(eventMap);
      const lastOrderDate = orders[0]?.confirmedAt || orders[0]?.createdAt || null;

      const ordersHistory = orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: Number(o.total),
        subtotal: Number(o.subtotal),
        fees: Number(o.fees),
        discount: Number(o.discount),
        confirmedAt: o.confirmedAt,
        createdAt: o.createdAt,
        event: o.event,
        items: o.items.map((i) => ({
          id: i.id,
          ticketType: i.ticketType,
          seat: i.seat,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          subtotal: Number(i.subtotal),
          ticketCode: i.ticketCode,
          qrCode: i.qrCode,
          isCheckedIn: i.isCheckedIn,
          checkedInAt: i.checkedInAt,
        })),
      }));

      return {
        id: b.id,
        name: b.name || "Khách hàng",
        email: b.email,
        phone: b.phone || null,
        avatar: b.avatar || null,
        createdAt: b.createdAt,
        totalSpent,
        orderCount,
        totalTickets,
        lastOrderDate,
        events: eventsList,
        ordersHistory,
      };
    });

    // 5. Apply Segment Filter if provided
    if (segment === "VIP") {
      processedCustomers = processedCustomers.filter((c) => c.totalSpent >= 1000000);
    } else if (segment === "LOYAL") {
      processedCustomers = processedCustomers.filter((c) => c.orderCount >= 2);
    } else if (segment === "NEW") {
      processedCustomers = processedCustomers.filter((c) => c.orderCount === 1);
    }

    // 6. Apply Sorting
    if (sortBy === "spent_desc") {
      processedCustomers.sort((a, b) => b.totalSpent - a.totalSpent);
    } else if (sortBy === "orders_desc") {
      processedCustomers.sort((a, b) => b.orderCount - a.orderCount);
    } else {
      // default: recent order date
      processedCustomers.sort((a, b) => {
        const timeA = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
        const timeB = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
        return timeB - timeA;
      });
    }

    // 7. Paginate Results
    const totalCustomers = processedCustomers.length;
    const totalPages = Math.ceil(totalCustomers / limitNum) || 1;
    const paginatedCustomers = processedCustomers.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      success: true,
      data: {
        stats: {
          totalCustomers: totalCustomersCount,
          totalTicketsSold,
          totalRevenue,
          avgSpendPerCustomer,
        },
        customers: paginatedCustomers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCustomers,
          totalPages,
        },
      },
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

// ─── Get Organizer Profile ──────────────────────────────────────────────
export async function getSellerProfile(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const profile = await prisma.organizerProfile.findUnique({
      where: { userId: sellerId },
      include: { bankInfo: true, documents: true },
    });
    const user = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { name: true, email: true, phone: true, avatar: true, role: true },
    });
    res.json({ success: true, data: { profile, user } });
  } catch (err) {
    next(err);
  }
}

// ─── Finance Overview ────────────────────────────────────────────────────
// ─── Finance Overview ────────────────────────────────────────────────────
export async function getFinanceOverview(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const { status, period } = req.query as Record<string, string>;

    // 1. Date filter construction
    let dateFilter: any = {};
    if (period === "7d") {
      dateFilter = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (period === "30d") {
      dateFilter = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    } else if (period === "90d") {
      dateFilter = { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
    }

    const [totalRevenue, allSettlements, pendingWithdrawals, completedWithdrawals] = await Promise.all([
      prisma.order.aggregate({
        where: { event: { sellerId }, status: { in: ["CONFIRMED", "PAID", "CHECKED_IN"] } },
        _sum: { total: true },
      }),
      prisma.settlement.findMany({
        where: {
          sellerId,
          ...(status && status !== "ALL" && { status }),
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        include: { event: { select: { id: true, title: true, startDate: true, endDate: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.withdrawal.aggregate({
        where: { sellerId, status: { in: ["PENDING", "PROCESSING"] } },
        _sum: { amount: true },
      }),
      prisma.withdrawal.aggregate({
        where: { sellerId, status: { in: ["APPROVED", "COMPLETED"] } },
        _sum: { amount: true },
      }),
    ]);

    const gross = Number(totalRevenue._sum.total || 0);
    const totalCommission = allSettlements.reduce((sum, s) => sum + Number(s.commissionFee || 0), 0);
    const totalSettled = allSettlements
      .filter(s => ["SETTLED", "COMPLETED", "PAID_OUT"].includes(s.status.toUpperCase()))
      .reduce((sum, s) => sum + Number(s.netAmount || 0), 0);
    const pendingSettlement = allSettlements
      .filter(s => ["PENDING", "PROCESSING"].includes(s.status.toUpperCase()))
      .reduce((sum, s) => sum + Number(s.netAmount || 0), 0);

    const pendingWithdrawalAmount = Number(pendingWithdrawals._sum.amount || 0);
    const completedWithdrawalAmount = Number(completedWithdrawals._sum.amount || 0);

    // Calculate Available Balance:
    // If settlements exist, available = totalSettled - completed - pending
    // If no settlement created yet, estimate effectiveSettled = gross * 0.93
    const effectiveSettled = totalSettled > 0 ? totalSettled : Math.round(gross * 0.93);
    const availableBalance = Math.max(0, effectiveSettled - completedWithdrawalAmount - pendingWithdrawalAmount);

    res.json({
      success: true,
      data: {
        grossRevenue: gross,
        totalCommission,
        totalSettled,
        pendingSettlement,
        availableBalance,
        pendingWithdrawals: pendingWithdrawalAmount,
        completedWithdrawals: completedWithdrawalAmount,
        settlements: allSettlements,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Bank Accounts CRUD ──────────────────────────────────────────────────
export async function getSellerBankAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const accounts = await prisma.sellerBankAccount.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: accounts });
  } catch (err) {
    next(err);
  }
}

export async function createSellerBankAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const { bankName, accountNumber, accountHolder, isDefault } = req.body;

    if (!bankName || !accountNumber || !accountHolder) {
      throw createError("Vui lòng điền đầy đủ Tên ngân hàng, Số tài khoản và Tên chủ tài khoản", 400);
    }

    if (isDefault) {
      await prisma.sellerBankAccount.updateMany({
        where: { sellerId },
        data: { isDefault: false },
      });
    }

    const newAccount = await prisma.sellerBankAccount.create({
      data: {
        sellerId,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim().toUpperCase(),
        isDefault: Boolean(isDefault),
      },
    });

    res.status(201).json({ success: true, message: "Đã thêm tài khoản ngân hàng thành công", data: newAccount });
  } catch (err) {
    next(err);
  }
}

export async function updateSellerBankAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const { id } = req.params;
    const { bankName, accountNumber, accountHolder, isDefault } = req.body;

    const existing = await prisma.sellerBankAccount.findFirst({
      where: { id: id as string, sellerId },
    });
    if (!existing) throw createError("Tài khoản ngân hàng không tồn tại", 404);

    if (isDefault) {
      await prisma.sellerBankAccount.updateMany({
        where: { sellerId },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.sellerBankAccount.update({
      where: { id: id as string },
      data: {
        ...(bankName && { bankName: bankName.trim() }),
        ...(accountNumber && { accountNumber: accountNumber.trim() }),
        ...(accountHolder && { accountHolder: accountHolder.trim().toUpperCase() }),
        ...(isDefault !== undefined && { isDefault: Boolean(isDefault) }),
      },
    });

    res.json({ success: true, message: "Đã cập nhật tài khoản ngân hàng", data: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteSellerBankAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const { id } = req.params;

    const existing = await prisma.sellerBankAccount.findFirst({
      where: { id: id as string, sellerId },
    });
    if (!existing) throw createError("Tài khoản ngân hàng không tồn tại", 404);

    await prisma.sellerBankAccount.delete({ where: { id: id as string } });

    res.json({ success: true, message: "Đã xóa tài khoản ngân hàng thành công" });
  } catch (err) {
    next(err);
  }
}

// ─── Withdrawal list ────────────────────────────────────────────────────
export async function getWithdrawals(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const { status } = req.query as Record<string, string>;

    const withdrawals = await prisma.withdrawal.findMany({
      where: {
        sellerId,
        ...(status && status !== "ALL" && { status }),
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: withdrawals });
  } catch (err) {
    next(err);
  }
}

// ─── Request Withdrawal ─────────────────────────────────────────────────
export async function requestWithdrawal(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const { amount, bankName, accountNumber, accountHolder, note } = req.body;

    const requestedAmount = Number(amount || 0);

    if (!requestedAmount || !bankName || !accountNumber || !accountHolder) {
      throw createError("Vui lòng điền đầy đủ thông tin rút tiền và chọn tài khoản ngân hàng", 400);
    }
    if (requestedAmount < 100000) {
      throw createError("Số tiền rút tối thiểu là 100,000 ₫", 400);
    }

    // Check available balance
    const [totalRevenue, allSettlements, pendingWithdrawals, completedWithdrawals] = await Promise.all([
      prisma.order.aggregate({
        where: { event: { sellerId }, status: { in: ["CONFIRMED", "CHECKED_IN"] } },
        _sum: { total: true },
      }),
      prisma.settlement.findMany({ where: { sellerId } }),
      prisma.withdrawal.aggregate({
        where: { sellerId, status: { in: ["PENDING", "PROCESSING"] } },
        _sum: { amount: true },
      }),
      prisma.withdrawal.aggregate({
        where: { sellerId, status: { in: ["APPROVED", "COMPLETED"] } },
        _sum: { amount: true },
      }),
    ]);

    const gross = Number(totalRevenue._sum.total || 0);
    const totalSettled = allSettlements
      .filter(s => ["SETTLED", "COMPLETED", "PAID_OUT"].includes(s.status.toUpperCase()))
      .reduce((sum, s) => sum + Number(s.netAmount || 0), 0);

    const pendingWithdrawalAmount = Number(pendingWithdrawals._sum.amount || 0);
    const completedWithdrawalAmount = Number(completedWithdrawals._sum.amount || 0);

    const effectiveSettled = totalSettled > 0 ? totalSettled : Math.round(gross * 0.93);
    const availableBalance = Math.max(0, effectiveSettled - completedWithdrawalAmount - pendingWithdrawalAmount);

    if (requestedAmount > availableBalance) {
      throw createError(`Số tiền rút (${requestedAmount.toLocaleString("vi-VN")} ₫) vượt quá số dư khả dụng (${availableBalance.toLocaleString("vi-VN")} ₫)`, 400);
    }

    // Check pending withdrawal
    const pendingCount = await prisma.withdrawal.count({
      where: { sellerId, status: { in: ["PENDING", "PROCESSING"] } },
    });
    if (pendingCount > 0) {
      throw createError("Bạn đã có yêu cầu rút tiền đang chờ xử lý", 400);
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        sellerId,
        amount: requestedAmount,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim().toUpperCase(),
        adminNote: note ? note.trim() : undefined,
        status: "PENDING",
      },
    });

    createNotification(
      sellerId,
      "Yêu cầu rút tiền đã được gửi",
      `Yêu cầu rút ${requestedAmount.toLocaleString("vi-VN")} ₫ của bạn đã được tiếp nhận và chờ xử lý.`,
      "WITHDRAWAL_REQUESTED",
      { withdrawalId: withdrawal.id }
    ).catch(console.error);

    createRoleNotification(
      "ADMIN",
      "Yêu cầu rút tiền mới",
      `Nhà tổ chức vừa gửi yêu cầu rút ${requestedAmount.toLocaleString("vi-VN")} ₫.`,
      "ADMIN_WITHDRAWAL_REQUESTED",
      { withdrawalId: withdrawal.id }
    ).catch(console.error);

    res.status(201).json({
      success: true,
      message: "Yêu cầu rút tiền đã được gửi thành công!",
      data: withdrawal,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Submit Event for Approval ───────────────────────────────────────────
export async function submitEventForApproval(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const eventId = req.params.eventId as string;

    const event = await prisma.event.findFirst({
      where: req.user!.role === "ADMIN" ? { id: eventId } : { id: eventId, sellerId },
    });
    if (!event) throw createError("Sự kiện không tồn tại", 404);

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { status: "PUBLISHED" },
    });

    res.json({
      success: true,
      data: updated,
      message: "Đã xuất bản sự kiện thành công.",
    });
  } catch (err) {
    next(err);
  }
}

// ─── Get event approval logs ────────────────────────────────────────────
export async function getEventApprovalLogs(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const eventId = req.params.eventId as string;

    const event = await prisma.event.findFirst({ where: { id: eventId, sellerId } });
    if (!event) throw createError("Event not found", 404);

    const logs = await prisma.eventApprovalLog.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
}
