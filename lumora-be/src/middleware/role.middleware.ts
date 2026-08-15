import { Request, Response, NextFunction } from "express";
import { createError } from "./errorHandler";
import prisma from "../prisma/client";

type Role = "BUYER" | "SELLER" | "ADMIN" | "STAFF";

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

/**
 * Staff-specific middleware: requires role=STAFF AND isActive=true in StaffMember.
 * Returns 403 with clear message if account is locked by Seller.
 */
export async function requireStaff(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(createError("Not authenticated", 401, "UNAUTHORIZED"));
    }

    if (req.user.role !== "STAFF") {
      return next(createError("Access denied. Staff role required.", 403, "FORBIDDEN"));
    }

    // Verify StaffMember record exists and is active
    const staffMember = await prisma.staffMember.findFirst({
      where: { userId: req.user.userId },
    });

    if (!staffMember) {
      return next(createError("Tài khoản nhân viên không tồn tại", 403, "FORBIDDEN"));
    }

    if (!staffMember.isActive) {
      return next(
        createError(
          "Tài khoản của bạn đã bị khóa bởi Seller. Vui lòng liên hệ quản lý để được mở khóa.",
          403,
          "ACCOUNT_LOCKED"
        )
      );
    }

    // Attach staffMember info to request for downstream use
    (req as any).staffMember = staffMember;
    next();
  } catch (err) {
    next(err);
  }
}
