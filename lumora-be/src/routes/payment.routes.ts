import { Router } from "express";
import * as PaymentController from "../controllers/payment.controller";
import { authenticate } from "../middleware/auth.middleware";

export const paymentRoutes = Router();

// Create VietQR payment link
paymentRoutes.post("/create", authenticate, PaymentController.createPayment);

// Check payment status (polling)
paymentRoutes.get("/:orderId/status", authenticate, PaymentController.getPaymentStatus);

// PayOS Webhook — raw body required (set in app.ts)
paymentRoutes.post("/webhook", PaymentController.handleWebhook);

// Cancel payment link
paymentRoutes.post("/:orderId/cancel", authenticate, PaymentController.cancelPayment);
