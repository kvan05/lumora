import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { createError } from "../middleware/errorHandler";

// ─── Create Review ──────────────────────────────────────────────────────
export async function createReview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { eventId, rating, content } = req.body;

    if (!eventId || !rating || !content) {
      throw createError("eventId, rating, and content are required", 400, "VALIDATION_ERROR");
    }
    if (rating < 1 || rating > 5) {
      throw createError("Rating must be between 1 and 5", 400, "VALIDATION_ERROR");
    }

    // Verify user attended this event (has a CONFIRMED order)
    const order = await prisma.order.findFirst({
      where: { eventId, buyerId: userId, status: { in: ["CONFIRMED", "CHECKED_IN"] } },
    });
    if (!order) {
      throw createError("Bạn chỉ có thể đánh giá sự kiện mà bạn đã tham dự", 403, "FORBIDDEN");
    }

    // Check if already reviewed
    const existing = await prisma.review.findFirst({ where: { userId, eventId } });
    if (existing) {
      throw createError("Bạn đã đánh giá sự kiện này rồi", 400, "ALREADY_REVIEWED");
    }

    const review = await prisma.review.create({
      data: { userId, eventId, rating, content },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

// ─── Get Reviews for Event ──────────────────────────────────────────────
export async function getEventReviews(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const eventId = req.params.eventId as string;
    const page = (req.query.page as string) || "1";
    const limit = (req.query.limit as string) || "10";
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total, stats] = await Promise.all([
      prisma.review.findMany({
        where: { eventId, isHidden: false },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      }),
      prisma.review.count({ where: { eventId, isHidden: false } }),
      prisma.review.aggregate({
        where: { eventId, isHidden: false },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        stats: {
          averageRating: stats._avg?.rating ? Math.round(stats._avg.rating * 10) / 10 : 0,
          totalReviews: typeof stats._count === "number" ? stats._count : (stats._count as any)?._all || 0,
        },
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

// ─── Create Report ──────────────────────────────────────────────────────
export async function createReport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reporterId = req.user!.userId;
    const { targetType, targetId, reason } = req.body;

    if (!targetType || !targetId || !reason) {
      throw createError("targetType, targetId, and reason are required", 400, "VALIDATION_ERROR");
    }

    const validTargets = ["EVENT", "USER", "REVIEW"];
    if (!validTargets.includes(targetType)) {
      throw createError("Invalid targetType", 400, "VALIDATION_ERROR");
    }

    const report = await prisma.report.create({
      data: { reporterId, targetType, targetId, reason },
    });

    res.status(201).json({ success: true, data: report, message: "Báo cáo đã được gửi thành công. Chúng tôi sẽ xem xét trong thời gian sớm nhất." });
  } catch (err) {
    next(err);
  }
}
