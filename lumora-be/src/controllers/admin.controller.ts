import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { createError } from "../middleware/errorHandler";

// ─── Dashboard Stats ───────────────────────────────────────────────────
export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const totalUsers = await prisma.user.count();
    const totalBuyers = await prisma.user.count({ where: { role: "BUYER" } });
    const totalSellers = await prisma.user.count({ where: { role: "SELLER" } });
    const totalEvents = await prisma.event.count();
    const totalOrders = await prisma.order.count();

    // Sum order totals for confirmed orders
    const orders = await prisma.order.findMany({
      where: { status: "CONFIRMED" },
      select: { total: true },
    });
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const platformFee = totalRevenue * 0.05; // 5% fee model

    res.json({
      success: true,
      data: {
        totalUsers,
        totalBuyers,
        totalSellers,
        totalEvents,
        totalOrders,
        totalRevenue,
        platformFee,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── User Management ───────────────────────────────────────────────────
export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role, search } = req.query;

    const where: any = {};
    if (role) {
      where.role = role as string;
    }
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } },
        { username: { contains: search as string } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedUsers = users.map((u) => ({
      ...u,
      isBlocked: !u.isVerified,
    }));

    res.json({ success: true, data: formattedUsers });
  } catch (err) {
    next(err);
  }
}

export async function toggleUserBlock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id: id as string } });
    if (!user) throw createError("User not found", 404);

    const updated = await prisma.user.update({
      where: { id: id as string },
      data: { isVerified: !user.isVerified },
    });

    res.json({
      success: true,
      message: updated.isVerified ? "Đã mở khóa tài khoản." : "Đã khóa tài khoản.",
      data: { ...updated, isBlocked: !updated.isVerified },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: id as string } });
    res.json({ success: true, message: "Đã xoá tài khoản người dùng." });
  } catch (err) {
    next(err);
  }
}

export async function approveOrganizer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const updated = await prisma.user.update({
      where: { id: id as string },
      data: { isVerified: true, role: "SELLER" },
    });
    res.json({ success: true, message: "Đã duyệt nhà tổ chức.", data: updated });
  } catch (err) {
    next(err);
  }
}

// ─── Event Management ──────────────────────────────────────────────────
export async function getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, search } = req.query;

    const where: any = {};
    if (status) {
      where.status = status as string;
    }
    if (search) {
      where.title = { contains: search as string };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        seller: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
}

export async function approveEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status, approvalNote } = req.body; // PUBLISHED or REJECTED

    const updated = await prisma.event.update({
      where: { id: id as string },
      data: {
        status,
        approvalNote,
        approvedAt: status === "PUBLISHED" ? new Date() : undefined,
        approvedById: req.user?.userId,
      },
    });

    res.json({ success: true, message: `Đã cập nhật trạng thái sự kiện thành ${status === "PUBLISHED" ? "Đã duyệt" : "Từ chối"}`, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function handleEditRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { action, approvalNote } = req.body; // "ACCEPT" or "REJECT"

    const event = await prisma.event.findUnique({ where: { id: id as string } });
    if (!event) throw createError("Sự kiện không tồn tại", 404);

    if (action === "ACCEPT") {
      if (!event.pendingChanges) {
        throw createError("Không có yêu cầu chỉnh sửa nào đang chờ duyệt", 400);
      }

      const changes = JSON.parse(event.pendingChanges);

      const updated = await prisma.event.update({
        where: { id: id as string },
        data: {
          ...changes,
          pendingChanges: null,
          editRequestStatus: "APPROVED",
          approvalNote: approvalNote || "Đã duyệt yêu cầu chỉnh sửa thông tin sự kiện",
        },
      });

      res.json({ success: true, message: "Đã duyệt và áp dụng thông tin chỉnh sửa mới cho sự kiện.", data: updated });
    } else {
      const updated = await prisma.event.update({
        where: { id: id as string },
        data: {
          pendingChanges: null,
          editRequestStatus: "REJECTED",
          approvalNote: approvalNote || "Đã từ chối yêu cầu chỉnh sửa thông tin sự kiện",
        },
      });

      res.json({ success: true, message: "Đã từ chối yêu cầu chỉnh sửa sự kiện.", data: updated });
    }
  } catch (err) {
    next(err);
  }
}

// ─── Category Management ───────────────────────────────────────────────
export async function getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await prisma.category.findMany({
      include: { subcategories: true },
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, parentId } = req.body;
    if (!name) throw createError("Tên danh mục là bắt buộc", 400);

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const category = await prisma.category.create({
      data: { name, slug, parentId },
    });

    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id: id as string } });
    res.json({ success: true, message: "Đã xoá danh mục." });
  } catch (err) {
    next(err);
  }
}

// ─── Voucher/Promotion Management ──────────────────────────────────────
export async function getVouchers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vouchers = await prisma.voucher.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: vouchers });
  } catch (err) {
    next(err);
  }
}

export async function createVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code, discountType, discountValue, maxDiscount, minOrderValue, startDate, endDate, usageLimit } = req.body;

    if (!code || !discountType || !discountValue || !startDate || !endDate) {
      throw createError("Vui lòng điền đầy đủ các thông tin bắt buộc", 400);
    }

    const voucher = await prisma.voucher.create({
      data: {
        code: code.toUpperCase(),
        discountType,
        discountValue,
        maxDiscount,
        minOrderValue,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        usageLimit,
      },
    });

    res.status(201).json({ success: true, data: voucher });
  } catch (err) {
    next(err);
  }
}

export async function deleteVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.voucher.delete({ where: { id: id as string } });
    res.json({ success: true, message: "Đã xoá mã giảm giá." });
  } catch (err) {
    next(err);
  }
}

// ─── Order Management ──────────────────────────────────────────────────
export async function getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string } },
        { buyer: { name: { contains: search as string } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        buyer: { select: { name: true, email: true } },
        event: { select: { title: true } },
        items: {
          include: {
            ticketType: { select: { name: true } },
            seat: { select: { seatLabel: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body; // CONFIRMED, CANCELLED, REFUNDED

    const updated = await prisma.order.update({
      where: { id: id as string },
      data: { status },
    });

    res.json({ success: true, message: `Cập nhật trạng thái đơn hàng thành ${status}`, data: updated });
  } catch (err) {
    next(err);
  }
}

// ─── Organizer Applications ───────────────────────────────────────────────
export async function getOrganizerApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = (req.query.status as string) || "PENDING";
    const applications = await prisma.organizerProfile.findMany({
      where: { verifyStatus: status },
      include: {
        user: { select: { name: true, email: true, phone: true, createdAt: true } },
        bankInfo: true,
        documents: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: applications });
  } catch (err) {
    next(err);
  }
}

export async function approveOrganizerApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const adminId = req.user!.userId;
    const id = req.params.id as string;

    const profile = await prisma.organizerProfile.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!profile) throw createError("Application not found", 404);
    if (profile.verifyStatus !== "PENDING") throw createError("Application is not in PENDING state", 400);

    await prisma.$transaction([
      prisma.organizerProfile.update({
        where: { id },
        data: { verifyStatus: "APPROVED", reviewedAt: new Date(), reviewedBy: adminId },
      }),
      prisma.user.update({
        where: { id: profile.userId },
        data: { role: "SELLER" },
      }),
      prisma.adminLog.create({
        data: { adminId, action: "APPROVED_ORGANIZER", details: JSON.stringify({ profileId: id, userId: profile.userId }) },
      }),
    ]);

    res.json({ success: true, message: `Đã duyệt đơn đăng ký Organizer. Tài khoản ${profile.user?.email || ""} đã được nâng lên SELLER.` });
  } catch (err) {
    next(err);
  }
}

export async function rejectOrganizerApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const adminId = req.user!.userId;
    const id = req.params.id as string;
    const { reason } = req.body;
    if (!reason) throw createError("Vui lòng nhập lý do từ chối", 400);

    const profile = await prisma.organizerProfile.findUnique({ where: { id } });
    if (!profile) throw createError("Application not found", 404);

    await prisma.$transaction([
      prisma.organizerProfile.update({
        where: { id },
        data: { verifyStatus: "REJECTED", rejectReason: reason, reviewedAt: new Date(), reviewedBy: adminId },
      }),
      prisma.adminLog.create({
        data: { adminId, action: "REJECTED_ORGANIZER", details: JSON.stringify({ profileId: id, reason }) },
      }),
    ]);

    res.json({ success: true, message: "Đã từ chối đơn đăng ký Organizer." });
  } catch (err) {
    next(err);
  }
}

// ─── Settlement Management ───────────────────────────────────────────────
export async function createSettlement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const adminId = req.user!.userId;
    const { eventId, commissionRate = 0.07, perTicketFee = 5000 } = req.body;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        orders: {
          where: { status: "CONFIRMED" },
          select: { total: true, items: { select: { quantity: true } } },
        },
      },
    });
    if (!event) throw createError("Event not found", 404);

    const existing = await prisma.settlement.findUnique({ where: { eventId } });
    if (existing) throw createError("Settlement đã tồn tại cho sự kiện này", 400);

    const grossRevenue = event.orders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalTickets = event.orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
    const commissionFee = grossRevenue * Number(commissionRate);
    const perTicketTotal = totalTickets * Number(perTicketFee);
    const netAmount = grossRevenue - commissionFee - perTicketTotal;

    const settlement = await prisma.settlement.create({
      data: {
        eventId,
        sellerId: event.sellerId,
        grossRevenue,
        commissionRate,
        commissionFee,
        perTicketFee: perTicketTotal,
        netAmount,
        status: "PENDING",
      },
    });

    await prisma.adminLog.create({
      data: { adminId, action: "CREATED_SETTLEMENT", details: JSON.stringify({ settlementId: settlement.id, eventId }) },
    });

    res.status(201).json({ success: true, data: settlement, message: "Tạo bảng đối soát thành công." });
  } catch (err) {
    next(err);
  }
}

export async function getSettlements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = req.query as Record<string, string>;
    const settlements = await prisma.settlement.findMany({
      where: status ? { status } : {},
      include: {
        event: { select: { title: true, endDate: true, sellerId: true, seller: { select: { name: true, email: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: settlements });
  } catch (err) {
    next(err);
  }
}

export async function processSettlement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const adminId = req.user!.userId;
    const id = req.params.id as string;
    const { status, note } = req.body; // PROCESSING or COMPLETED

    const updated = await prisma.settlement.update({
      where: { id },
      data: { status, note, processedAt: status === "COMPLETED" ? new Date() : undefined },
    });

    await prisma.adminLog.create({
      data: { adminId, action: `SETTLEMENT_${status}`, details: JSON.stringify({ settlementId: id }) },
    });

    res.json({ success: true, data: updated, message: `Đã cập nhật trạng thái đối soát thành ${status}` });
  } catch (err) {
    next(err);
  }
}

// ─── Withdrawal Management ───────────────────────────────────────────────
export async function getWithdrawalRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = req.query.status as string | undefined;
    const withdrawals = await prisma.withdrawal.findMany({
      where: status ? { status } : {},
      include: {
        seller: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: withdrawals });
  } catch (err) {
    next(err);
  }
}

export async function processWithdrawal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const adminId = req.user!.userId;
    const id = req.params.id as string;
    const { status, adminNote } = req.body; // PROCESSING, COMPLETED, REJECTED

    const updated = await prisma.withdrawal.update({
      where: { id },
      data: {
        status,
        adminNote,
        processedAt: ["COMPLETED", "REJECTED"].includes(status) ? new Date() : undefined,
      },
    });

    await prisma.adminLog.create({
      data: { adminId, action: `WITHDRAWAL_${status}`, details: JSON.stringify({ withdrawalId: id, adminNote }) },
    });

    res.json({ success: true, data: updated, message: `Đã xử lý yêu cầu rút tiền: ${status}` });
  } catch (err) {
    next(err);
  }
}

