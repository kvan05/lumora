import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { createError } from "../middleware/errorHandler";
import bcrypt from "bcryptjs";

const getSellerId = (req: Request): string => req.user!.userId;

// Helper: check staff belongs to this seller
async function getStaffOrFail(staffId: string, sellerId: string) {
  const staff = await prisma.staffMember.findFirst({
    where: { id: staffId, sellerId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, avatar: true, isVerified: true, createdAt: true } },
      assignments: {
        include: {
          event: { select: { id: true, title: true, startDate: true, endDate: true, status: true, bannerUrl: true, venue: true } },
        },
      },
    },
  });
  if (!staff) throw createError("Không tìm thấy nhân viên hoặc không có quyền truy cập", 404);
  return staff;
}

// ─── List Staff ──────────────────────────────────────────────────────────
export async function listStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const search = req.query.search as string | undefined;
    const isActiveRaw = req.query.isActive as string | undefined;

    const where: any = { sellerId };

    if (isActiveRaw !== undefined && isActiveRaw !== "") {
      where.isActive = isActiveRaw === "true";
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.user = {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      };
    }

    const staffList = await prisma.staffMember.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            isVerified: true,
            createdAt: true,
          },
        },
        assignments: {
          include: {
            event: { select: { id: true, title: true, startDate: true, status: true } },
          },
        },
      },
    });

    const data = staffList.map((s) => ({
      id: s.id,
      userId: s.userId,
      sellerId: s.sellerId,
      isActive: s.isActive,
      note: s.note,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      name: s.user.name,
      email: s.user.email,
      phone: s.user.phone,
      avatar: s.user.avatar,
      isVerified: s.user.isVerified,
      assignedEvents: s.assignments.map((a) => ({
        assignmentId: a.id,
        eventId: a.event.id,
        eventTitle: a.event.title,
        startDate: a.event.startDate,
        status: a.event.status,
      })),
      eventCount: s.assignments.length,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ─── Get Staff Detail ────────────────────────────────────────────────────
export async function getStaffDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const staffId = req.params["staffId"] as string;

    const staff = await getStaffOrFail(staffId, sellerId);

    const checkinStats = await Promise.all(
      staff.assignments.map(async (a) => {
        const [total, done] = await Promise.all([
          prisma.orderItem.count({
            where: { order: { eventId: a.event.id, status: { in: ["CONFIRMED", "CHECKED_IN"] } } },
          }),
          prisma.orderItem.count({
            where: { order: { eventId: a.event.id, status: { in: ["CONFIRMED", "CHECKED_IN"] } }, isCheckedIn: true },
          }),
        ]);
        return {
          eventId: a.event.id,
          eventTitle: a.event.title,
          startDate: a.event.startDate,
          endDate: a.event.endDate,
          venue: a.event.venue,
          status: a.event.status,
          totalTickets: total,
          checkedIn: done,
          remaining: Math.max(0, total - done),
        };
      })
    );

    res.json({
      success: true,
      data: {
        id: staff.id,
        userId: staff.userId,
        sellerId: staff.sellerId,
        isActive: staff.isActive,
        note: staff.note,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
        name: staff.user.name,
        email: staff.user.email,
        phone: staff.user.phone,
        avatar: staff.user.avatar,
        isVerified: staff.user.isVerified,
        userCreatedAt: staff.user.createdAt,
        assignedEvents: checkinStats,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Create Staff ────────────────────────────────────────────────────────
export async function createStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const { name, email, phone, password, note } = req.body as Record<string, string | undefined>;

    if (!name || !name.trim()) throw createError("Họ tên nhân viên là bắt buộc", 400);
    if (!email || !email.trim()) throw createError("Email nhân viên là bắt buộc", 400);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) throw createError("Email không hợp lệ", 400);

    const lowerEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: lowerEmail } });

    if (existingUser) {
      const existingStaff = await prisma.staffMember.findFirst({ where: { userId: existingUser.id, sellerId } });
      if (existingStaff) {
        throw createError("Email này đã được đăng ký làm nhân viên trong đội của bạn", 400);
      }
      const otherStaff = await prisma.staffMember.findFirst({ where: { userId: existingUser.id } });
      if (otherStaff) {
        throw createError("Email này đã thuộc nhân viên của một Seller khác", 400);
      }
    }

    const plainPassword = password && password.trim() ? password.trim() : generateTempPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    let userId: string;
    let userName: string;
    let userEmail: string;
    let userPhone: string | null;

    if (existingUser) {
      const updated = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: name.trim(),
          phone: phone?.trim() || existingUser.phone,
          role: "STAFF",
          isVerified: true,
          password: hashedPassword,
        },
      });
      userId = updated.id;
      userName = updated.name ?? name.trim();
      userEmail = updated.email;
      userPhone = updated.phone;
    } else {
      const created = await prisma.user.create({
        data: {
          name: name.trim(),
          email: lowerEmail,
          phone: phone?.trim() || null,
          password: hashedPassword,
          role: "STAFF",
          isVerified: true,
        },
      });
      userId = created.id;
      userName = created.name ?? name.trim();
      userEmail = created.email;
      userPhone = created.phone;
    }

    const staff = await prisma.staffMember.create({
      data: {
        userId,
        sellerId,
        isActive: true,
        note: note?.trim() || null,
      },
    });

    res.status(201).json({
      success: true,
      message: `Đã tạo tài khoản nhân viên thành công cho ${userName}. Mật khẩu tạm: ${plainPassword}`,
      data: {
        id: staff.id,
        userId,
        name: userName,
        email: userEmail,
        phone: userPhone,
        isActive: staff.isActive,
        note: staff.note,
        createdAt: staff.createdAt,
        tempPassword: plainPassword,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Update Staff ────────────────────────────────────────────────────────
export async function updateStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const staffId = req.params["staffId"] as string;
    const { name, phone, note, newPassword } = req.body as Record<string, string | undefined>;

    const staff = await getStaffOrFail(staffId, sellerId);

    const userUpdate: Record<string, unknown> = {};
    if (name && name.trim()) userUpdate.name = name.trim();
    if (phone !== undefined) userUpdate.phone = phone?.trim() || null;
    if (newPassword && newPassword.trim().length >= 6) {
      userUpdate.password = await bcrypt.hash(newPassword.trim(), 10);
    }

    const staffUpdate: Record<string, unknown> = {};
    if (note !== undefined) staffUpdate.note = note?.trim() || null;

    await Promise.all([
      Object.keys(userUpdate).length > 0
        ? prisma.user.update({ where: { id: staff.userId }, data: userUpdate })
        : Promise.resolve(),
      Object.keys(staffUpdate).length > 0
        ? prisma.staffMember.update({ where: { id: staffId }, data: staffUpdate })
        : Promise.resolve(),
    ]);

    const updated = await getStaffOrFail(staffId, sellerId);

    res.json({
      success: true,
      message: "Đã cập nhật thông tin nhân viên",
      data: {
        id: updated.id,
        name: updated.user.name,
        email: updated.user.email,
        phone: updated.user.phone,
        isActive: updated.isActive,
        note: updated.note,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Toggle Staff Active / Locked ────────────────────────────────────────
export async function toggleStaffActive(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const staffId = req.params["staffId"] as string;
    const { isActive } = req.body as { isActive: boolean };

    if (typeof isActive !== "boolean") throw createError("isActive (boolean) là bắt buộc", 400);

    const staff = await getStaffOrFail(staffId, sellerId);

    await prisma.staffMember.update({ where: { id: staffId }, data: { isActive } });

    res.json({
      success: true,
      message: isActive
        ? `Đã mở khóa tài khoản nhân viên ${staff.user.name}`
        : `Đã khóa tài khoản nhân viên ${staff.user.name}. Nhân viên sẽ không thể đăng nhập.`,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Delete Staff ────────────────────────────────────────────────────────
export async function deleteStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const staffId = req.params["staffId"] as string;

    await getStaffOrFail(staffId, sellerId);

    await prisma.staffMember.delete({ where: { id: staffId } });

    res.json({ success: true, message: "Đã xóa nhân viên khỏi danh sách" });
  } catch (err) {
    next(err);
  }
}

// ─── Assign Events to Staff ──────────────────────────────────────────────
export async function assignEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const staffId = req.params["staffId"] as string;
    const { eventIds } = req.body as { eventIds: string[] };

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      throw createError("eventIds là mảng bắt buộc và không được rỗng", 400);
    }

    await getStaffOrFail(staffId, sellerId);

    const events = await prisma.event.findMany({
      where: { id: { in: eventIds }, sellerId },
      select: { id: true, title: true },
    });

    if (events.length !== eventIds.length) {
      throw createError("Một số sự kiện không thuộc quyền quản lý của bạn", 403);
    }

    await prisma.staffEventAssignment.createMany({
      data: eventIds.map((eventId) => ({ staffMemberId: staffId, eventId })),
      skipDuplicates: true,
    });

    res.json({ success: true, message: `Đã gán ${events.length} sự kiện cho nhân viên` });
  } catch (err) {
    next(err);
  }
}

// ─── Remove Event Assignment ─────────────────────────────────────────────
export async function removeEventAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const staffId = req.params["staffId"] as string;
    const eventId = req.params["eventId"] as string;

    await getStaffOrFail(staffId, sellerId);

    const event = await prisma.event.findFirst({ where: { id: eventId, sellerId } });
    if (!event) throw createError("Sự kiện không thuộc quyền quản lý của bạn", 403);

    await prisma.staffEventAssignment.deleteMany({
      where: { staffMemberId: staffId, eventId },
    });

    res.json({ success: true, message: "Đã bỏ gán sự kiện cho nhân viên" });
  } catch (err) {
    next(err);
  }
}

// ─── Replace All Assignments ─────────────────────────────────────────────
export async function setEventAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sellerId = getSellerId(req);
    const staffId = req.params["staffId"] as string;
    const { eventIds } = req.body as { eventIds: string[] };

    if (!Array.isArray(eventIds)) throw createError("eventIds (array) là bắt buộc", 400);

    await getStaffOrFail(staffId, sellerId);

    if (eventIds.length > 0) {
      const events = await prisma.event.findMany({
        where: { id: { in: eventIds }, sellerId },
        select: { id: true },
      });
      if (events.length !== eventIds.length) {
        throw createError("Một số sự kiện không thuộc quyền quản lý của bạn", 403);
      }
    }

    await prisma.$transaction([
      prisma.staffEventAssignment.deleteMany({ where: { staffMemberId: staffId } }),
      ...(eventIds.length > 0
        ? [
            prisma.staffEventAssignment.createMany({
              data: eventIds.map((eventId) => ({ staffMemberId: staffId, eventId })),
            }),
          ]
        : []),
    ]);

    res.json({
      success: true,
      message: eventIds.length > 0
        ? `Đã cập nhật gán ${eventIds.length} sự kiện cho nhân viên`
        : "Đã bỏ gán toàn bộ sự kiện cho nhân viên",
    });
  } catch (err) {
    next(err);
  }
}

// ─── Helper: Generate temp password ─────────────────────────────────────
function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pwd = "";
  for (let i = 0; i < 10; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}
