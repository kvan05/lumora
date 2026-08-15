import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { createError } from "../middleware/errorHandler";

const getStaffUserId = (req: Request): string => req.user!.userId;
const getStaffMember = (req: Request) => (req as any).staffMember as {
  id: string;
  sellerId: string;
  userId: string;
  isActive: boolean;
};

// ─── Helper: verify staff has access to this event ───────────────────────────
async function verifyStaffEventAccess(staffMemberId: string, eventId: string) {
  const assignment = await prisma.staffEventAssignment.findUnique({
    where: { staffMemberId_eventId: { staffMemberId, eventId } },
    include: {
      event: {
        select: {
          id: true, title: true, startDate: true, endDate: true,
          status: true, venue: true, address: true, city: true,
          bannerUrl: true, sellerId: true,
        },
      },
    },
  });
  if (!assignment) {
    throw createError("Bạn không có quyền truy cập sự kiện này", 403, "FORBIDDEN");
  }
  return assignment.event;
}

// ─── GET /api/staff/events ────────────────────────────────────────────────────
export async function getMyEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const staffMember = getStaffMember(req);

    const assignments = await prisma.staffEventAssignment.findMany({
      where: { staffMemberId: staffMember.id },
      include: {
        event: {
          select: {
            id: true, title: true, slug: true, startDate: true, endDate: true,
            status: true, venue: true, address: true, city: true, bannerUrl: true,
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });

    // Fetch check-in stats for each event
    const data = await Promise.all(
      assignments.map(async (a) => {
        const [totalTickets, checkedInTickets] = await Promise.all([
          prisma.orderItem.count({
            where: {
              order: {
                eventId: a.event.id,
                status: { in: ["CONFIRMED", "CHECKED_IN"] },
              },
            },
          }),
          prisma.orderItem.count({
            where: {
              order: {
                eventId: a.event.id,
                status: { in: ["CONFIRMED", "CHECKED_IN"] },
              },
              isCheckedIn: true,
            },
          }),
        ]);

        return {
          assignmentId: a.id,
          event: a.event,
          stats: {
            totalTickets,
            checkedIn: checkedInTickets,
            remaining: Math.max(0, totalTickets - checkedInTickets),
            percentage: totalTickets > 0 ? Math.round((checkedInTickets / totalTickets) * 100) : 0,
          },
        };
      })
    );

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/staff/checkin ──────────────────────────────────────────────────
export async function scanTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const staffUserId = getStaffUserId(req);
    const staffMember = getStaffMember(req);
    const { code, eventId } = req.body as { code: string; eventId: string };

    if (!code || !code.trim()) throw createError("Mã vé là bắt buộc", 400);
    if (!eventId) throw createError("eventId là bắt buộc", 400);

    const trimmedCode = code.trim();

    // 1. Verify staff access to this event
    const event = await verifyStaffEventAccess(staffMember.id, eventId);

    // 2. Find the OrderItem by ticketCode or id
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        OR: [
          { ticketCode: trimmedCode },
          { id: trimmedCode },
        ],
      },
      include: {
        order: {
          include: {
            buyer: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
            event: { select: { id: true, title: true, sellerId: true } },
          },
        },
        ticketType: { select: { id: true, name: true, price: true, color: true } },
        seat: { select: { id: true, seatLabel: true, seatNumber: true } },
      },
    });

    // 3. Handle various error cases

    // 3a. Ticket not found
    if (!orderItem) {
      await prisma.checkinLog.create({
        data: {
          ticketCode: trimmedCode,
          eventId,
          staffUserId,
          sellerId: staffMember.sellerId,
          action: "INVALID",
          note: "Mã vé không tồn tại trong hệ thống",
        },
      });
      res.status(404).json({
        success: false,
        action: "INVALID",
        message: "Mã vé không tồn tại trong hệ thống",
      });
      return;
    }

    // 3b. Ticket belongs to wrong event
    if (orderItem.order.event.id !== eventId) {
      await prisma.checkinLog.create({
        data: {
          ticketCode: trimmedCode,
          orderItemId: orderItem.id,
          eventId,
          staffUserId,
          sellerId: staffMember.sellerId,
          action: "WRONG_EVENT",
          note: `Vé thuộc sự kiện "${orderItem.order.event.title}", không phải sự kiện đang quét`,
        },
      });
      res.status(400).json({
        success: false,
        action: "WRONG_EVENT",
        message: `Vé này thuộc sự kiện "${orderItem.order.event.title}", không phải sự kiện hiện tại`,
      });
      return;
    }

    // 3c. Order cancelled / expired
    const invalidStatuses = ["CANCELLED", "EXPIRED", "PENDING"];
    if (invalidStatuses.includes(orderItem.order.status)) {
      await prisma.checkinLog.create({
        data: {
          ticketCode: trimmedCode,
          orderItemId: orderItem.id,
          eventId,
          staffUserId,
          sellerId: staffMember.sellerId,
          action: "CANCELLED",
          note: `Đơn hàng có trạng thái: ${orderItem.order.status}`,
        },
      });
      res.status(400).json({
        success: false,
        action: "CANCELLED",
        message: `Vé không hợp lệ – đơn hàng ở trạng thái: ${orderItem.order.status}`,
      });
      return;
    }

    // 3d. Already checked in
    if (orderItem.isCheckedIn) {
      await prisma.checkinLog.create({
        data: {
          ticketCode: trimmedCode,
          orderItemId: orderItem.id,
          eventId,
          staffUserId,
          sellerId: staffMember.sellerId,
          action: "ALREADY_CHECKED_IN",
          note: `Đã check-in lúc ${orderItem.checkedInAt?.toISOString()}`,
        },
      });
      res.status(409).json({
        success: false,
        action: "ALREADY_CHECKED_IN",
        message: "Vé này đã được check-in rồi",
        data: {
          checkedInAt: orderItem.checkedInAt,
          buyer: orderItem.order.buyer,
          ticketType: orderItem.ticketType,
          seat: orderItem.seat,
        },
      });
      return;
    }

    // 4. SUCCESS – mark as checked in
    const now = new Date();
    await prisma.orderItem.update({
      where: { id: orderItem.id },
      data: { isCheckedIn: true, checkedInAt: now },
    });

    // Write checkin log
    await prisma.checkinLog.create({
      data: {
        ticketCode: trimmedCode,
        orderItemId: orderItem.id,
        eventId,
        staffUserId,
        sellerId: staffMember.sellerId,
        action: "SUCCESS",
      },
    });

    res.json({
      success: true,
      action: "SUCCESS",
      message: "Check-in thành công!",
      data: {
        orderItemId: orderItem.id,
        ticketCode: trimmedCode,
        checkedInAt: now,
        buyer: orderItem.order.buyer,
        ticketType: orderItem.ticketType,
        seat: orderItem.seat,
        orderNumber: orderItem.order.orderNumber,
        eventTitle: event.title,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/staff/events/:eventId/tickets ───────────────────────────────────
export async function getEventTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const staffMember = getStaffMember(req);
    const eventId = req.params["eventId"] as string;
    const search = req.query.search as string | undefined;
    const status = (req.query.status as string) || "ALL"; // ALL | CHECKED_IN | NOT_CHECKED_IN
    const page = Math.max(1, parseInt((req.query.page as string) || "1"));
    const limit = Math.min(50, parseInt((req.query.limit as string) || "20"));

    await verifyStaffEventAccess(staffMember.id, eventId);

    const where: any = {
      order: {
        eventId,
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
      },
    };

    if (status === "CHECKED_IN") where.isCheckedIn = true;
    if (status === "NOT_CHECKED_IN") where.isCheckedIn = false;

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { ticketCode: { contains: q, mode: "insensitive" } },
        { id: { contains: q, mode: "insensitive" } },
        { order: { buyer: { name: { contains: q, mode: "insensitive" } } } },
        { order: { buyer: { email: { contains: q, mode: "insensitive" } } } },
        { order: { orderNumber: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.orderItem.count({ where }),
      prisma.orderItem.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: [{ isCheckedIn: "asc" }, { createdAt: "desc" }],
        include: {
          order: {
            include: {
              buyer: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
            },
          },
          ticketType: { select: { id: true, name: true, price: true, color: true } },
          seat: { select: { id: true, seatLabel: true, seatNumber: true } },
        },
      }),
    ]);

    const data = items.map((item) => ({
      id: item.id,
      ticketCode: item.ticketCode,
      isCheckedIn: item.isCheckedIn,
      checkedInAt: item.checkedInAt,
      createdAt: item.createdAt,
      buyer: item.order.buyer,
      orderNumber: item.order.orderNumber,
      ticketType: item.ticketType,
      seat: item.seat,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    res.json({
      success: true,
      data: {
        tickets: data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/staff/events/:eventId/logs ─────────────────────────────────────
export async function getCheckinLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const staffMember = getStaffMember(req);
    const staffUserId = getStaffUserId(req);
    const eventId = req.params["eventId"] as string;
    const page = Math.max(1, parseInt((req.query.page as string) || "1"));
    const limit = Math.min(50, parseInt((req.query.limit as string) || "20"));

    await verifyStaffEventAccess(staffMember.id, eventId);

    const [total, logs] = await Promise.all([
      prisma.checkinLog.count({ where: { eventId, staffUserId } }),
      prisma.checkinLog.findMany({
        where: { eventId, staffUserId },
        orderBy: { scannedAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/staff/events/:eventId ──────────────────────────────────────────
export async function getEventDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const staffMember = getStaffMember(req);
    const eventId = req.params["eventId"] as string;

    const event = await verifyStaffEventAccess(staffMember.id, eventId);

    const [totalTickets, checkedInTickets] = await Promise.all([
      prisma.orderItem.count({
        where: { order: { eventId, status: { in: ["CONFIRMED", "CHECKED_IN"] } } },
      }),
      prisma.orderItem.count({
        where: { order: { eventId, status: { in: ["CONFIRMED", "CHECKED_IN"] } }, isCheckedIn: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        event,
        stats: {
          totalTickets,
          checkedIn: checkedInTickets,
          remaining: Math.max(0, totalTickets - checkedInTickets),
          percentage: totalTickets > 0 ? Math.round((checkedInTickets / totalTickets) * 100) : 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
