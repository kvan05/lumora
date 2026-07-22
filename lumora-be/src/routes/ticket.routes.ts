import { Router } from "express";
import * as TicketController from "../controllers/ticket.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireSeller } from "../middleware/role.middleware";

export const ticketRoutes = Router();

// Public: get ticket types for an event
ticketRoutes.get("/:eventId/tickets", TicketController.getTicketTypes);

// Seller: manage ticket types
ticketRoutes.post("/:eventId/tickets", authenticate, requireSeller, TicketController.createTicketType);
ticketRoutes.put("/:eventId/tickets/:ticketId", authenticate, requireSeller, TicketController.updateTicketType);
ticketRoutes.delete("/:eventId/tickets/:ticketId", authenticate, requireSeller, TicketController.deleteTicketType);
