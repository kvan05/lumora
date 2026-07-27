import rateLimit from "express-rate-limit";
import { Request } from "express";

const customKeyGenerator = (req: Request) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  if (Array.isArray(ip)) return ip[0];
  if (typeof ip === 'string') return ip.split(',')[0].trim();
  return '127.0.0.1';
};

/**
 * General API rate limit: 100 requests per 15 minutes
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: customKeyGenerator,
  message: {
    success: false,
    error: { message: "Too many requests, please try again later.", code: "RATE_LIMIT" },
  },
});

/**
 * Auth endpoints: 10 attempts per 15 minutes (brute force protection)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: customKeyGenerator,
  message: {
    success: false,
    error: { message: "Too many login attempts, please try again in 15 minutes.", code: "AUTH_RATE_LIMIT" },
  },
});

/**
 * Ticket booking: 5 order attempts per minute (anti-bot)
 */
export const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req) => req.user?.userId || customKeyGenerator(req),
  message: {
    success: false,
    error: { message: "Booking limit reached. Please wait before trying again.", code: "BOOKING_RATE_LIMIT" },
  },
});
