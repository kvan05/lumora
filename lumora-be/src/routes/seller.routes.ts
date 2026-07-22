import { Router } from "express";
import * as SellerController from "../controllers/seller.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireSeller } from "../middleware/role.middleware";

export const sellerRoutes = Router();

// All seller routes require authentication + SELLER role
sellerRoutes.use(authenticate, requireSeller);

sellerRoutes.get("/dashboard", SellerController.getDashboard);
sellerRoutes.get("/events", SellerController.getSellerEvents);
sellerRoutes.get("/orders", SellerController.getSellerOrders);
sellerRoutes.get("/orders/:orderId", SellerController.getSellerOrderDetail);
sellerRoutes.patch("/orders/:orderId/checkin", SellerController.checkInOrder);
sellerRoutes.patch("/orders/items/:itemId/checkin", SellerController.checkInItem);
sellerRoutes.get("/analytics", SellerController.getAnalytics);
sellerRoutes.get("/customers", SellerController.getCustomers);
sellerRoutes.get("/reports/export", SellerController.exportReport);
