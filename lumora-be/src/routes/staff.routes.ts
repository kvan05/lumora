import { Router } from "express";
import * as StaffController from "../controllers/staff.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireSeller } from "../middleware/role.middleware";

export const staffRoutes = Router();

// All staff routes require authentication + SELLER (or ADMIN) role
staffRoutes.use(authenticate, requireSeller);

// ─── Staff CRUD ──────────────────────────────────────────────────────────
staffRoutes.get("/", StaffController.listStaff);
staffRoutes.post("/", StaffController.createStaff);
staffRoutes.get("/:staffId", StaffController.getStaffDetail);
staffRoutes.patch("/:staffId", StaffController.updateStaff);
staffRoutes.patch("/:staffId/toggle-active", StaffController.toggleStaffActive);
staffRoutes.delete("/:staffId", StaffController.deleteStaff);

// ─── Event Assignment ────────────────────────────────────────────────────
staffRoutes.post("/:staffId/events", StaffController.assignEvents);
staffRoutes.put("/:staffId/events", StaffController.setEventAssignments);
staffRoutes.delete("/:staffId/events/:eventId", StaffController.removeEventAssignment);
