import { Router } from "express";
import * as SeatController from "../controllers/seat.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireSeller } from "../middleware/role.middleware";

export const seatRoutes = Router();

// Public: view seat map
seatRoutes.get("/:eventId/seats", SeatController.getSeatMap);

// Seller: configure seat map
seatRoutes.post("/:eventId/seats/sections", authenticate, requireSeller, SeatController.createSection);
seatRoutes.put("/:eventId/seats/sections/:sectionId", authenticate, requireSeller, SeatController.updateSection);
seatRoutes.delete("/:eventId/seats/sections/:sectionId", authenticate, requireSeller, SeatController.deleteSection);
seatRoutes.post("/:eventId/seats/sections/:sectionId/generate", authenticate, requireSeller, SeatController.generateSeats);
seatRoutes.patch("/:eventId/seats/:seatId/block", authenticate, requireSeller, SeatController.blockSeat);
