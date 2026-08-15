import { Router } from "express";
import * as StaffCheckinController from "../controllers/staff-checkin.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireStaff } from "../middleware/role.middleware";

export const staffCheckinRoutes = Router();

// All routes require: valid JWT + role=STAFF + isActive=true
staffCheckinRoutes.use(authenticate, requireStaff);

// ─── Events ──────────────────────────────────────────────────────────────────
staffCheckinRoutes.get("/events", StaffCheckinController.getMyEvents);
staffCheckinRoutes.get("/events/:eventId", StaffCheckinController.getEventDetail);

// ─── Tickets in an event ─────────────────────────────────────────────────────
staffCheckinRoutes.get("/events/:eventId/tickets", StaffCheckinController.getEventTickets);

// ─── Check-in scan ───────────────────────────────────────────────────────────
staffCheckinRoutes.post("/checkin", StaffCheckinController.scanTicket);

// ─── Checkin logs ─────────────────────────────────────────────────────────────
staffCheckinRoutes.get("/events/:eventId/logs", StaffCheckinController.getCheckinLogs);
