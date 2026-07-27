import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { createError } from "../middleware/errorHandler";
// @ts-ignore - TS Server caching issue
import { generateSlug } from "../utils/slug";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

// ─── List Events (with filter + pagination) ────────────────────────────
export async function listEvents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      category,
      city,
      search,
      date,
      price,
      page = "1",
      limit = "12",
      sort = "upcoming",
    } = req.query as Record<string, string>;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {
      status: "PUBLISHED",
      ...(category && { category }),
      ...(city && { city }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { venue: { contains: search } },
          { city: { contains: search } },
        ],
      }),
    };

    // Date semantic filters
    if (date) {
      const now = new Date();
      if (date === "today") {
        where.startDate = { gte: startOfDay(now), lte: endOfDay(now) };
      } else if (date === "this_week") {
        where.startDate = { gte: startOfWeek(now), lte: endOfWeek(now) };
      } else if (date === "this_month") {
        where.startDate = { gte: startOfMonth(now), lte: endOfMonth(now) };
      }
    }

    // Price semantic filters
    if (price) {
      if (price === "free") {
        where.ticketTypes = { some: { price: 0 } };
      } else if (price === "under_500") {
        where.ticketTypes = { some: { price: { gt: 0, lte: 500000 } } };
      } else if (price === "500_1000") {
        where.ticketTypes = { some: { price: { gt: 500000, lte: 1000000 } } };
      } else if (price === "over_1000") {
        where.ticketTypes = { some: { price: { gt: 1000000 } } };
      }
    }

    let orderBy: any = { startDate: "asc" }; // Default upcoming
    if (sort === "latest") orderBy = { createdAt: "desc" };
    else if (sort === "upcoming") orderBy = { startDate: "asc" };
    else if (sort === "price_asc") orderBy = { ticketTypes: { _min: { price: "asc" } } };
    else if (sort === "price_desc") orderBy = { ticketTypes: { _max: { price: "desc" } } };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy,
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
          isFeatured: true,
          hasSeatMap: true,
          ticketTypes: {
            where: { status: "ACTIVE" },
            select: { price: true },
            orderBy: { price: "asc" },
            take: 1,
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        events: events.map((e: any) => ({
          ...e,
          minPrice: e.ticketTypes[0]?.price ?? null,
          ticketTypes: undefined,
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

// ─── Get Featured Events ───────────────────────────────────────────────
export async function getFeaturedEvents(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const events = await prisma.event.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      take: 6,
      orderBy: { startDate: "asc" },
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
        ticketTypes: {
          where: { status: "ACTIVE" },
          select: { price: true },
          orderBy: { price: "asc" },
          take: 1,
        },
      },
    });

    res.json({
      success: true,
      data: events.map((e: any) => ({
        ...e,
        minPrice: e.ticketTypes[0]?.price ?? null,
        ticketTypes: undefined,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// ─── Get Event by Slug ─────────────────────────────────────────────────
export async function getEventBySlug(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const slug = req.params.slug as string;

    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        seller: {
          select: { id: true, name: true, avatar: true, email: true },
        },
        ticketTypes: {
          where: { status: { in: ["ACTIVE", "SOLD_OUT"] } },
          orderBy: { sortOrder: "asc" },
          include: { inventory: true },
        },
        seatSections: {
          orderBy: { sortOrder: "asc" },
          include: {
            rows: {
              orderBy: { sortOrder: "asc" },
              include: { seats: true },
            },
          },
        },
      },
    });

    if (!event || event.status !== "PUBLISHED") {
      throw createError("Event not found", 404, "EVENT_NOT_FOUND");
    }

    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
}

// ─── Get Categories ────────────────────────────────────────────────────
export async function getCategories(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await prisma.event.groupBy({
      by: ["category"],
      where: { status: "PUBLISHED" },
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
    });

    res.json({
      success: true,
      data: result.map((r: any) => ({ name: r.category, count: r._count.category })),
    });
  } catch (err) {
    next(err);
  }
}

// ─── Get Cities ────────────────────────────────────────────────────────
export async function getCities(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await prisma.event.groupBy({
      by: ["city"],
      where: { status: "PUBLISHED" },
      _count: { city: true },
      orderBy: { _count: { city: "desc" } },
    });

    res.json({
      success: true,
      data: result.map((r: any) => ({ name: r.city, count: r._count.city })),
    });
  } catch (err) {
    next(err);
  }
}

// ─── Create Event ──────────────────────────────────────────────────────
export async function createEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sellerId = req.user!.userId;
    const {
      title,
      description,
      bannerUrl,
      imageUrls,
      category,
      venue,
      address,
      city,
      latitude,
      longitude,
      startDate,
      endDate,
      hasSeatMap = false,
      tags,
      metaTitle,
      metaDesc,
    } = req.body;

    if (!title || !description || !category || !venue || !address || !city || !startDate || !endDate) {
      throw createError("Missing required event fields", 400, "VALIDATION_ERROR");
    }

    const slug = await generateSlug(title);

    const event = await prisma.event.create({
      data: {
        sellerId,
        title,
        slug,
        description,
        bannerUrl,
        imageUrls: imageUrls ? JSON.stringify(imageUrls) : null,
        category,
        venue,
        address,
        city,
        latitude,
        longitude,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        hasSeatMap,
        tags: tags ? JSON.stringify(tags) : null,
        metaTitle,
        metaDesc,
        status: "DRAFT",
      },
    });

    res.status(201).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
}

// ─── Update Event ──────────────────────────────────────────────────────
export async function updateEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const sellerId = req.user!.userId;

    const event = await prisma.event.findFirst({
      where: { id, sellerId },
    });
    if (!event) throw createError("Event not found or access denied", 404);

    const {
      title,
      description,
      bannerUrl,
      imageUrls,
      category,
      venue,
      address,
      city,
      latitude,
      longitude,
      startDate,
      endDate,
      tags,
      metaTitle,
      metaDesc,
    } = req.body;

    const updated = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        bannerUrl,
        imageUrls: imageUrls ? JSON.stringify(imageUrls) : undefined,
        category,
        venue,
        address,
        city,
        latitude,
        longitude,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        tags: tags ? JSON.stringify(tags) : undefined,
        metaTitle,
        metaDesc,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// ─── Update Event Status ───────────────────────────────────────────────
export async function updateEventStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const sellerId = req.user!.userId;

    const validStatuses = ["DRAFT", "PUBLISHED", "PAUSED", "CANCELLED", "COMPLETED"];
    if (!validStatuses.includes(status)) {
      throw createError("Invalid status", 400, "INVALID_STATUS");
    }

    const event = await prisma.event.findFirst({ where: { id, sellerId } });
    if (!event) throw createError("Event not found or access denied", 404);

    const updated = await prisma.event.update({ where: { id }, data: { status } });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// ─── Delete Event ──────────────────────────────────────────────────────
export async function deleteEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const sellerId = req.user!.userId;

    const event = await prisma.event.findFirst({ where: { id, sellerId } });
    if (!event) throw createError("Event not found or access denied", 404);

    // Soft delete: set status to CANCELLED instead of hard delete
    await prisma.event.update({ where: { id }, data: { status: "CANCELLED" } });
    res.json({ success: true, message: "Event cancelled successfully" });
  } catch (err) {
    next(err);
  }
}
