import { Router } from "express";
import * as NotificationController from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth.middleware";

export const notificationRoutes = Router();

notificationRoutes.use(authenticate);

notificationRoutes.get("/", NotificationController.getMyNotifications);          // Get all notifications
notificationRoutes.patch("/:id/read", NotificationController.markAsRead);        // Mark one as read
notificationRoutes.patch("/all/read", NotificationController.markAsRead);        // Mark all as read (id="all")
