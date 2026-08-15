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

// ─── Check-in Single Item (by barcode/ticket code/id) ───────────────────
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
export async function getFinanceOverview(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const sellerId = getSellerId(req);

    const [totalRevenue, settlements, pendingWithdrawals, completedWithdrawals] = await Promise.all([
      prisma.order.aggregate({
        where: { event: { sellerId }, status: "CONFIRMED" },
        _sum: { total: true },
      }),
      prisma.settlement.findMany({
        where: { sellerId },
        include: { event: { select: { title: true, endDate: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.withdrawal.aggregate({
        where: { sellerId, status: { in: ["PENDING", "PROCESSING"] } },
        _sum: { amount: true },
      }),
      prisma.withdrawal.aggregate({
        where: { sellerId, status: "COMPLETED" },
        _sum: { amount: true },
      }),
    ]);

    const gross = Number(totalRevenue._sum.total || 0);
    const totalCommission = settlements.reduce((sum, s) => sum + Number(s.commissionFee), 0);
    const totalSettled = settlements
      .filter(s => s.status === "COMPLETED")
      .reduce((sum, s) => sum + Number(s.netAmount), 0);
    const pendingSettlement = settlements
      .filter(s => s.status === "PENDING" || s.status === "PROCESSING")
      .reduce((sum, s) => sum + Number(s.netAmount), 0);

    res.json({
      success: true,
      data: {
        grossRevenue: gross,
        totalCommission,
        totalSettled,
        pendingSettlement,
        pendingWithdrawals: Number(pendingWithdrawals._sum.amount || 0),
        completedWithdrawals: Number(completedWithdrawals._sum.amount || 0),
        settlements,
      },
    });
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
    const withdrawals = await prisma.withdrawal.findMany({
      where: { sellerId },
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
    const { amount, bankName, accountNumber, accountHolder } = req.body;

    if (!amount || !bankName || !accountNumber || !accountHolder) {
      throw createError("Vui lòng điền đầy đủ thông tin rút tiền", 400);
    }
    if (Number(amount) < 100000) {
      throw createError("Số tiền rút tối thiểu là 100,000 ₫", 400);
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
        amount,
        bankName,
        accountNumber,
        accountHolder,
        status: "PENDING",
      },
    });

    // Send notifications to Seller and Admins
    createNotification(
      sellerId,
      "Yêu cầu rút tiền đã được gửi",
      `Yêu cầu rút ${Number(amount).toLocaleString("vi-VN")} ₫ của bạn đã được tiếp nhận và chờ xử lý.`,
      "WITHDRAWAL_REQUESTED",
      { withdrawalId: withdrawal.id }
    ).catch(console.error);

    createRoleNotification(
      "ADMIN",
      "Yêu cầu rút tiền mới",
      `Nhà tổ chức vừa gửi yêu cầu rút ${Number(amount).toLocaleString("vi-VN")} ₫.`,
      "ADMIN_WITHDRAWAL_REQUESTED",
      { withdrawalId: withdrawal.id }
    ).catch(console.error);

    res.status(201).json({
      success: true,
      data: withdrawal,
      message: "Yêu cầu rút tiền đã được gửi. Admin sẽ xử lý trong 1-3 ngày làm việc.",
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
      data: { status: "PENDING_APPROVAL" },
    });

    res.json({
      success: true,
      data: updated,
      message: "Đã gửi sự kiện để Admin xét duyệt.",
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
