import { Router } from "express";
import * as AdminController from "../controllers/admin.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/role.middleware";

export const adminRoutes = Router();

// Guard all admin routes with authentications + admin authorization
adminRoutes.use(authenticate, requireAdmin);

// Dashboard stats
adminRoutes.get("/stats", AdminController.getStats);

// User management
adminRoutes.get("/users", AdminController.getUsers);
adminRoutes.patch("/users/:id/block", AdminController.toggleUserBlock);
adminRoutes.delete("/users/:id", AdminController.deleteUser);
adminRoutes.patch("/users/:id/approve-organizer", AdminController.approveOrganizer);

// Event management
adminRoutes.get("/events", AdminController.getEvents);
adminRoutes.patch("/events/:id/status", AdminController.approveEvent);
adminRoutes.patch("/events/:id/edit-request", AdminController.handleEditRequest);

// Category management
adminRoutes.get("/categories", AdminController.getCategories);
adminRoutes.post("/categories", AdminController.createCategory);
adminRoutes.delete("/categories/:id", AdminController.deleteCategory);

// Voucher/Promo management
adminRoutes.get("/vouchers", AdminController.getVouchers);
adminRoutes.post("/vouchers", AdminController.createVoucher);
adminRoutes.delete("/vouchers/:id", AdminController.deleteVoucher);

// Order management
adminRoutes.get("/orders", AdminController.getOrders);
adminRoutes.patch("/orders/:id/status", AdminController.updateOrderStatus);

// Organizer application management
adminRoutes.get("/organizer-applications", AdminController.getOrganizerApplications);
adminRoutes.patch("/organizer-applications/:id/approve", AdminController.approveOrganizerApplication);
adminRoutes.patch("/organizer-applications/:id/reject", AdminController.rejectOrganizerApplication);

// Settlement management
adminRoutes.get("/settlements", AdminController.getSettlements);
adminRoutes.post("/settlements", AdminController.createSettlement);
adminRoutes.patch("/settlements/:id", AdminController.processSettlement);

// Withdrawal management
adminRoutes.get("/withdrawals", AdminController.getWithdrawalRequests);
adminRoutes.patch("/withdrawals/:id", AdminController.processWithdrawal);

// E-ticket & Check-in (Mã vạch Barcode)
adminRoutes.get("/checkin", AdminController.getCheckinTickets);
adminRoutes.post("/checkin/verify", AdminController.verifyCheckinTicket);

