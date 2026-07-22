import jwt from "jsonwebtoken";
import { JwtPayload } from "../middleware/auth.middleware";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

/**
 * Generate access token
 */
export function generateAccessToken(payload: JwtPayload, expiresIn = JWT_EXPIRES_IN): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

/**
 * Generate long-lived refresh token (7 days)
 */
export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/**
 * Verify and decode refresh token
 */
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
}

/**
 * Calculate expiry date from duration string (e.g. "7d" → Date)
 */
export function getExpiryDate(duration: string): Date {
  const unit = duration.slice(-1);
  const value = parseInt(duration.slice(0, -1), 10);
  const ms: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return new Date(Date.now() + value * (ms[unit] || 1000));
}

/**
 * Generate Action Token (for Email Verification / Password Reset)
 */
export function generateActionToken(payload: any, expiresIn = "1h"): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

/**
 * Verify Action Token
 */
export function verifyActionToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}
