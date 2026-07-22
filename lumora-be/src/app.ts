import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import dotenv from "dotenv";
import { initializeSocket } from "./socket";
import { errorHandler } from "./middleware/errorHandler";
import { authRoutes } from "./routes/auth.routes";
import { eventRoutes } from "./routes/event.routes";
import { ticketRoutes } from "./routes/ticket.routes";
import { orderRoutes } from "./routes/order.routes";
import { paymentRoutes } from "./routes/payment.routes";
import { sellerRoutes } from "./routes/seller.routes";
import { seatRoutes } from "./routes/seat.routes";
import { startOrderTimeoutJob } from "./jobs/orderTimeout.job";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ─── Security ─────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// ─── Body Parsing ──────────────────────────────────────────────────────
// PayOS SDK verifyPaymentWebhookData works with parsed JSON directly
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ──────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "Lumora API", timestamp: new Date() });
});

// ─── API Routes ───────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/events", ticketRoutes);    // /api/events/:id/tickets
app.use("/api/events", seatRoutes);      // /api/events/:id/seats
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/seller", sellerRoutes);

// ─── Error Handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

// ─── Socket.io ────────────────────────────────────────────────────────
initializeSocket(httpServer);

// ─── Background Jobs ──────────────────────────────────────────────────
startOrderTimeoutJob();

// ─── Start Server ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Lumora API running on http://localhost:${PORT}`);
});

export { app, httpServer };
