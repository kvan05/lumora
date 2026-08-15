import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { initializeSocket } from "./socket";
import { errorHandler } from "./middleware/errorHandler";
import { authRoutes } from "./routes/auth.routes";
import { eventRoutes } from "./routes/event.routes";
import { ticketRoutes } from "./routes/ticket.routes";
import { orderRoutes } from "./routes/order.routes";
import { paymentRoutes } from "./routes/payment.routes";
import { sellerRoutes } from "./routes/seller.routes";
import { seatRoutes } from "./routes/seat.routes";
import { adminRoutes } from "./routes/admin.routes";
import { favoriteRoutes } from "./routes/favorite.routes";
import { reviewRoutes } from "./routes/review.routes";
import { notificationRoutes } from "./routes/notification.routes";
import { staffRoutes } from "./routes/staff.routes";
import { staffCheckinRoutes } from "./routes/staff-checkin.routes";
import { startOrderTimeoutJob } from "./jobs/orderTimeout.job";

// ─── Parse allowed origins from FRONTEND_URL env var ──────────────────
// Supports comma-separated list: FRONTEND_URL=http://localhost:3000,https://lumora.vn
export const ALLOWED_ORIGINS: string[] = (
  process.env.FRONTEND_URL || "http://localhost:3000"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

console.log("🌐 CORS allowed origins:", ALLOWED_ORIGINS);

/** Returns true if the given origin should be allowed */
export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // non-browser clients (curl, Postman, mobile)
  return (
    ALLOWED_ORIGINS.includes(origin) ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1")
  );
}

const app = express();
const httpServer = createServer(app);

// ─── Security ─────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false, crossOriginEmbedderPolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' is not allowed`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-CSRF-Token"],
    exposedHeaders: ["Authorization"],
  })
);
// Ensure preflight OPTIONS requests are handled for all routes
// Note: Express 5 requires regex instead of bare "*" wildcard
app.options(/.*/, cors());

// ─── Body Parsing ──────────────────────────────────────────────────────
// High body limit for base64 image uploads (banner & venue maps)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ─── Health Check ──────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "Lumora API", timestamp: new Date() });
});

// ─── API Routes ───────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/events", ticketRoutes);    // /api/events/:id/tickets
app.use("/api/events", seatRoutes);      // /api/events/:id/seats
app.use("/api/seller/events", seatRoutes); // /api/seller/events/:id/seats
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api", reviewRoutes);  // /api/events/:eventId/reviews, /api/reviews, /api/reports
app.use("/api/notifications", notificationRoutes);
app.use("/api/seller/staff", staffRoutes);
app.use("/api/staff", staffCheckinRoutes);

// ─── Error Handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

// ─── Socket.io ────────────────────────────────────────────────────────
initializeSocket(httpServer);

// ─── Background Jobs ──────────────────────────────────────────────────
startOrderTimeoutJob();

// ─── Start Server ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Lumora API running on http://localhost:${PORT}`);
});

export { app, httpServer };
