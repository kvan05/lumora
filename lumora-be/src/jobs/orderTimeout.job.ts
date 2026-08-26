import cron from "node-cron";
import prisma from "../prisma/client";
import { releaseInventory, cleanupExpiredReservations } from "../controllers/order.controller";
import { getSocketIO } from "../socket";

/**
 * Order timeout job — runs every 30 seconds.
 * Finds PENDING orders past their expiresAt, releases reserved inventory,
 * and cleans up any orphaned expired seat holds.
 */
export function startOrderTimeoutJob(): void {
  console.log("⏰ Order & Seat timeout job started (runs every 30s)");

  // Run every 30 seconds
  cron.schedule("*/30 * * * * *", async () => {
    try {
      const now = new Date();
      const expiredOrders = await prisma.order.findMany({
        where: {
          status: "PENDING",
          expiresAt: { lt: now },
        },
        include: { items: true },
        take: 50,
      });

      if (expiredOrders.length > 0) {
        console.log(`⏰ [TimeoutJob] Releasing ${expiredOrders.length} expired order(s)...`);

        for (const order of expiredOrders) {
          try {
            await releaseInventory(order.items, order.id, order.eventId);

            // Notify buyer their reservation expired
            try {
              const io = getSocketIO();
              io.to(`user:${order.buyerId}`).emit("order:expired", {
                orderId: order.id,
                orderNumber: order.orderNumber,
              });
            } catch (e) {
              console.warn("[TimeoutJob] Socket emit error:", e);
            }

            console.log(`  ✓ Auto-released expired order ${order.orderNumber}`);
          } catch (err) {
            console.error(`  ✗ Failed to release order ${order.id}:`, err);
          }
        }
      }

      // Also clean up any orphaned expired seat holds
      await cleanupExpiredReservations();
    } catch (err) {
      console.error("[OrderTimeoutJob] Error:", err);
    }
  });
}
