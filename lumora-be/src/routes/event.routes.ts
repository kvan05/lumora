import { Router } from "express";
import * as EventController from "../controllers/event.controller";
import { authenticate, optionalAuth } from "../middleware/auth.middleware";
import { requireSeller, requireAdmin } from "../middleware/role.middleware";

export const eventRoutes = Router();

// ── Public routes ──────────────────────────────────────────────────────
eventRoutes.get("/", optionalAuth, EventController.listEvents);
eventRoutes.get("/featured", EventController.getFeaturedEvents);
eventRoutes.get("/categories", EventController.getCategories);
eventRoutes.get("/cities", EventController.getCities);
eventRoutes.get("/:slug", optionalAuth, EventController.getEventBySlug);

// ── Seller routes ──────────────────────────────────────────────────────
eventRoutes.post("/", authenticate, requireSeller, EventController.createEvent);
eventRoutes.put("/:id", authenticate, requireSeller, EventController.updateEvent);
eventRoutes.patch("/:id/status", authenticate, requireAdmin, EventController.updateEventStatus);
eventRoutes.delete("/:id", authenticate, requireSeller, EventController.deleteEvent);
