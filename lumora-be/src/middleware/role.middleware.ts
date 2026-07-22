import { Request, Response, NextFunction } from "express";
import { createError } from "./errorHandler";

type Role = "BUYER" | "SELLER" | "ADMIN";

/**
 * Role-based access control guard.
 * Usage: requireRole("SELLER") or requireRole("SELLER", "ADMIN")
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError("Not authenticated", 401, "UNAUTHORIZED"));
    }

    const userRole = req.user.role as Role;
    if (!allowedRoles.includes(userRole)) {
      return next(
        createError(
          `Access denied. Required role: ${allowedRoles.join(" or ")}`,
          403,
          "FORBIDDEN"
        )
      );
    }

    next();
  };
}

// Convenience shortcuts
export const requireBuyer = requireRole("BUYER", "ADMIN");
export const requireSeller = requireRole("SELLER", "ADMIN");
export const requireAdmin = requireRole("ADMIN");
