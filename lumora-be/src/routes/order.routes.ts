import { Router } from "express";
import * as OrderController from "../controllers/order.controller";
import { authenticate } from "../middleware/auth.middleware";
import { bookingLimiter } from "../middleware/rateLimiter";

export const orderRoutes = Router();

// All order routes require authentication
orderRoutes.use(authenticate);

orderRoutes.post("/", bookingLimiter, OrderController.createOrder);       // Reserve seats + create order
orderRoutes.get("/", OrderController.getMyOrders);                        // Buyer's order history
orderRoutes.get("/:id", OrderController.getOrderById);                    // Order detail + tickets
orderRoutes.post("/:id/cancel", OrderController.cancelOrder);             // Cancel + release inventory
orderRoutes.patch("/:id/apply-voucher", OrderController.applyVoucher);    // Apply voucher to order
orderRoutes.post("/:id/refund", OrderController.requestRefund);           // Request refund

