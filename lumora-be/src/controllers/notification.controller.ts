import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { createError } from "../middleware/errorHandler";

// ─── Get My Notifications ───────────────────────────────────────────────
export async function getMyNotifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { page = "1", limit = "20" } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
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

// ─── Mark as Read ────────────────────────────────────────────────────────
export async function markAsRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    if (id === "all") {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      res.json({ success: true, message: "Đã đánh dấu tất cả là đã đọc" });
    } else {
      const notification = await prisma.notification.findFirst({ where: { id, userId } });
      if (!notification) throw createError("Notification not found", 404);

      await prisma.notification.update({ where: { id }, data: { isRead: true } });
      res.json({ success: true, message: "Đã đánh dấu đã đọc" });
    }
  } catch (err) {
    next(err);
  }
}

// ─── Create Notification (internal helper, also exported for use in other controllers) ──
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  metadata?: Record<string, any>
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}
