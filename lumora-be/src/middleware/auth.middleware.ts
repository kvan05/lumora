import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createError } from "./errorHandler";
import prisma from "../prisma/client";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Verifies JWT from Authorization header: "Bearer <token>"
 * Attaches decoded payload to req.user
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw createError("No token provided", 401, "UNAUTHORIZED");
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload;

    // Check session still exists in DB (for logout / revocation)
    const session = await prisma.userSession.findUnique({
      where: { token },
    });
    if (!session || session.expiresAt < new Date()) {
      throw createError("Session expired or invalid", 401, "SESSION_EXPIRED");
    }

    req.user = payload;
    next();
  } catch (err: any) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      next(createError("Invalid or expired token", 401, "TOKEN_INVALID"));
    } else {
      next(err);
    }
  }
}

/**
 * Optional auth — sets req.user if token exists but does NOT block request
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      req.user = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as JwtPayload;
    }
  } catch {
    // Ignore auth errors for optional routes
  }
  next();
}
