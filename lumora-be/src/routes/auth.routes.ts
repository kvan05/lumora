import { Router } from "express";
import * as AuthController from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authLimiter } from "../middleware/rateLimiter";

export const authRoutes = Router();

// Public routes (rate limited)
authRoutes.post("/register", authLimiter, AuthController.register);
authRoutes.post("/register/verify", authLimiter, AuthController.verifyRegisterOtp);
authRoutes.post("/login", authLimiter, AuthController.login);
authRoutes.post("/oauth", authLimiter, AuthController.oauth);
authRoutes.post("/oauth/verify", authLimiter, AuthController.verifyOauthOtp);
authRoutes.post("/refresh", AuthController.refreshToken);
authRoutes.post("/forgot-password", authLimiter, AuthController.forgotPassword);
authRoutes.post("/reset-password", authLimiter, AuthController.resetPassword);

// Protected routes
authRoutes.post("/logout", authenticate, AuthController.logout);
authRoutes.get("/me", authenticate, AuthController.getMe);
authRoutes.put("/profile", authenticate, AuthController.updateProfile);
authRoutes.put("/change-password", authenticate, AuthController.changePassword);
authRoutes.delete("/account", authenticate, AuthController.deleteAccount);
authRoutes.post("/become-organizer", authenticate, AuthController.becomeOrganizer);
authRoutes.get("/organizer-status", authenticate, AuthController.getOrganizerStatus);


