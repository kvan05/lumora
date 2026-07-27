import { Router } from "express";
import * as ReviewController from "../controllers/review.controller";
import { authenticate, optionalAuth } from "../middleware/auth.middleware";

export const reviewRoutes = Router();

// Public: get reviews for an event
reviewRoutes.get("/events/:eventId/reviews", ReviewController.getEventReviews);

// Protected: create review, create report
reviewRoutes.post("/reviews", authenticate, ReviewController.createReview);
reviewRoutes.post("/reports", authenticate, ReviewController.createReport);
