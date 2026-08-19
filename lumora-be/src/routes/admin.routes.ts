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
adminRoutes.patch("/users/:id/role", AdminController.updateUserRole);
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

// Ticket management
adminRoutes.get("/tickets", AdminController.getCheckinTickets);

// Organizer application management
adminRoutes.get("/organizers", AdminController.getOrganizers);
adminRoutes.get("/organizers/:id/details", AdminController.getOrganizerDetail);
adminRoutes.patch("/organizers/:id/admin-note", AdminController.updateOrganizerAdminNote);
adminRoutes.get("/organizer-applications", AdminController.getOrganizerApplications);
adminRoutes.patch("/organizer-applications/:id/approve", AdminController.approveOrganizerApplication);
adminRoutes.patch("/organizer-applications/:id/reject", AdminController.rejectOrganizerApplication);

// Payments management
adminRoutes.get("/payments", AdminController.getPayments);

// Finance & Settlement management
adminRoutes.get("/finance/stats", AdminController.getFinanceStats);
adminRoutes.get("/settlements", AdminController.getSettlements);
adminRoutes.post("/settlements", AdminController.createSettlement);
adminRoutes.patch("/settlements/:id", AdminController.processSettlement);

// Withdrawal management
adminRoutes.get("/withdrawals", AdminController.getWithdrawalRequests);
adminRoutes.patch("/withdrawals/:id", AdminController.processWithdrawal);

// E-ticket & Check-in (Mã vạch Barcode)
adminRoutes.get("/checkin", AdminController.getCheckinTickets);
adminRoutes.get("/checkin/stats", AdminController.getCheckinStats);
adminRoutes.post("/checkin/verify", AdminController.verifyCheckinTicket);
adminRoutes.post("/checkin/override", AdminController.overrideCheckin);

// Refund & Complaint management
adminRoutes.get("/refunds", AdminController.getRefundRequests);
adminRoutes.post("/refunds/:id/approve", AdminController.approveRefund);
adminRoutes.post("/refunds/:id/reject", AdminController.rejectRefund);

// Audit logs
adminRoutes.get("/logs", AdminController.getAdminLogs);

// ─── 6 Advanced Admin Features Routes ────────────────────────────────────
adminRoutes.get("/control-center", AdminController.getControlCenterData);
adminRoutes.get("/risk-alerts", AdminController.getRiskAlerts);
adminRoutes.patch("/risk-alerts/:id", AdminController.updateRiskAlertStatus);
adminRoutes.get("/tickets/:ticketId/timeline", AdminController.getTicketTimeline);
adminRoutes.get("/events/health-scores", AdminController.getEventHealthScores);
adminRoutes.get("/reconciliation", AdminController.getFinancialReconciliation);
adminRoutes.post("/reconciliation", AdminController.createReconciliationSnapshot);

// Reviews & Feedback management
adminRoutes.get("/reviews", AdminController.getAdminReviews);
adminRoutes.patch("/reviews/:id/toggle-hide", AdminController.toggleHideReview);
adminRoutes.delete("/reviews/:id", AdminController.deleteReview);



