import cron from "node-cron";
import prisma from "../prisma/client";
import { releaseInventory } from "../controllers/order.controller";
import { getSocketIO } from "../socket";

/**
 * Order timeout job — runs every minute.
 * Finds PENDING orders past their expiresAt and releases reserved inventory.
 */
export function startOrderTimeoutJob(): void {
  console.log("⏰ Order timeout job started (runs every minute)");

  cron.schedule("* * * * *", async () => {
    try {
      const expiredOrders = await prisma.order.findMany({
        where: {
          status: "PENDING",
          expiresAt: { lt: new Date() },
        },
        include: { items: true },
        take: 50, // Process in batches
      });

      if (expiredOrders.length === 0) return;

      console.log(`⏰ Releasing ${expiredOrders.length} expired order(s)...`);

      for (const order of expiredOrders) {
        try {
          await releaseInventory(order.items, order.id);

          // Notify event room of freed inventory
          const io = getSocketIO();
          io.to(`event:${order.eventId}`).emit("inventory:update", {
            eventId: order.eventId,
            reason: "order_timeout",
          });

          // Notify buyer their reservation expired
          io.to(`user:${order.buyerId}`).emit("order:expired", {
            orderId: order.id,
            orderNumber: order.orderNumber,
          });

          console.log(`  ✓ Released order ${order.orderNumber}`);
        } catch (err) {
          console.error(`  ✗ Failed to release order ${order.id}:`, err);
        }
      }
    } catch (err) {
      console.error("[OrderTimeoutJob] Error:", err);
    }
  });
}
