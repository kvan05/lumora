import { Router } from "express";
import * as FavoriteController from "../controllers/favorite.controller";
import { authenticate } from "../middleware/auth.middleware";

export const favoriteRoutes = Router();

favoriteRoutes.use(authenticate);

favoriteRoutes.get("/", FavoriteController.getMyFavorites);                         // List all favorites
favoriteRoutes.post("/:eventId/toggle", FavoriteController.toggleFavorite);         // Toggle favorite
favoriteRoutes.get("/:eventId/check", FavoriteController.checkFavorite);            // Check if favorited
