import { Router } from "express";
import * as NotificationController from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth.middleware";

export const notificationRoutes = Router();

notificationRoutes.use(authenticate);

notificationRoutes.get("/", NotificationController.getMyNotifications);
notificationRoutes.get("/unread-count", NotificationController.getUnreadCount);
notificationRoutes.patch("/:id/read", NotificationController.markAsRead);
notificationRoutes.patch("/all/read", NotificationController.markAsRead);
notificationRoutes.delete("/:id", NotificationController.deleteNotification);
