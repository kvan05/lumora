import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { createError } from "../middleware/errorHandler";

// ─── Toggle Favorite (like/unlike) ─────────────────────────────────────
export async function toggleFavorite(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const eventId = req.params.eventId as string;

    const event = await prisma.event.findFirst({ where: { id: eventId, status: "PUBLISHED" } });
    if (!event) throw createError("Event not found", 404);

    const existing = await prisma.favorite.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      res.json({ success: true, isFavorited: false, message: "Đã xóa khỏi danh sách yêu thích" });
    } else {
      await prisma.favorite.create({ data: { userId, eventId } });
      res.json({ success: true, isFavorited: true, message: "Đã thêm vào danh sách yêu thích" });
    }
  } catch (err) {
    next(err);
  }
}

// ─── Get My Favorites ───────────────────────────────────────────────────
export async function getMyFavorites(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const page = (req.query.page as string) || "1";
    const limit = (req.query.limit as string) || "12";
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              bannerUrl: true,
              category: true,
              venue: true,
              city: true,
              startDate: true,
              endDate: true,
              status: true,
              ticketTypes: {
                where: { status: "ACTIVE" },
                select: { price: true },
                orderBy: { price: "asc" },
                take: 1,
              },
            },
          },
        },
      }),
      prisma.favorite.count({ where: { userId } }),
    ]);

    res.json({
      success: true,
      data: {
        favorites: favorites.map((f) => ({
          id: f.id,
          createdAt: f.createdAt,
          event: {
            ...f.event,
            minPrice: f.event.ticketTypes[0]?.price ?? null,
            ticketTypes: undefined,
          },
        })),
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

// ─── Check if favorited ─────────────────────────────────────────────────
export async function checkFavorite(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const eventId = req.params.eventId as string;

    const favorite = await prisma.favorite.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    res.json({ success: true, isFavorited: !!favorite });
  } catch (err) {
    next(err);
  }
}
