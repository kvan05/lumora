import { customAlphabet } from "nanoid";

const numericNanoid = customAlphabet("0123456789", 8);
const alphaNumNanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 10);

/**
 * Generate unique order number: ORD-12345678
 */
export function generateOrderNumber(): string {
  return `ORD-${numericNanoid()}`;
}

/**
 * Generate unique ticket code: LMR-ABCD123456
 */
export function generateTicketCode(): string {
  return `LMR-${alphaNumNanoid()}`;
}
