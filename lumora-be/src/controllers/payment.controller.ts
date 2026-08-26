import { Request, Response, NextFunction } from "express";
import { PayOS } from "@payos/node";
import prisma from "../prisma/client";
import { createError } from "../middleware/errorHandler";
import { getSocketIO } from "../socket";
import { sendOrderConfirmationEmail } from "../utils/email";
import { releaseInventory } from "./order.controller";
import { generateTicketCode } from "../utils/orderUtils";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// ─── PayOS Client (Official SDK) ─────────────────────────────────────────
const payos = (process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY)
  ? new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY
  })
  : null;

// ─── Create VietQR Payment ───────────────────────────────────────────────
export async function createPayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!payos) {
      throw createError("Hệ thống thanh toán PayOS chưa được cấu hình API Key trên Server", 500);
    }
    const { orderId } = req.body;
    const buyerId = req.user!.userId;

    const order = await prisma.order.findFirst({
      where: { id: orderId, buyerId, status: "PENDING" },
      include: {
        event: { select: { title: true } },
        buyer: { select: { email: true, name: true } },
        items: {
          include: {
            ticketType: { select: { name: true } },
            seat: { select: { seatLabel: true } },
          },
        },
      },
    });

    if (!order) throw createError("Order not found or already processed", 404);
    if (order.expiresAt < new Date()) {
      throw createError("Order has expired. Please create a new order.", 410, "ORDER_EXPIRED");
    }

    // Check if payment already exists and is pending
    const existingPayment = await prisma.payment.findUnique({
      where: { orderId: order.id },
    });
    if (existingPayment && existingPayment.status === "PENDING") {
      // Return existing payment link instead of creating new one
      res.json({
        success: true,
        data: {
          checkoutUrl: existingPayment.checkoutUrl,
          qrCode: existingPayment.qrCode,
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: Math.max(0, Math.round(Number(order.subtotal) - Number(order.discount || 0))),
          expiresAt: order.expiresAt,
        },
      });
      return;
    }

    // PayOS order code must be a unique number ≤ 9007199254740991
    const payosOrderCode = Number(String(Date.now()).slice(-9));
    const amountVND = Math.max(0, Math.round(Number(order.subtotal) - Number(order.discount || 0)));

    // Build items list for QR display
    const items = order.items.map((item) => ({
      name: item.seat
        ? `Ghế ${item.seat.seatLabel}`
        : item.ticketType?.name || "Vé vào cổng",
      quantity: 1,
      price: Math.round(Number(item.unitPrice)),
    }));

    // Description max 25 chars (PayOS limit)
    const desc = `LM${order.orderNumber}`.slice(0, 25);

    const paymentLinkData = await payos.paymentRequests.create({
      orderCode: payosOrderCode,
      amount: amountVND,
      description: desc,
      buyerName: (order.buyer.name || "Lumora User").slice(0, 255),
      buyerEmail: order.buyer.email,
      items,
      returnUrl: `${FRONTEND_URL}/checkout/${order.id}/status`,
      cancelUrl: `${FRONTEND_URL}/checkout/${order.id}/status?cancel=true`,
      expiredAt: Math.floor(order.expiresAt.getTime() / 1000),
    });

    const { checkoutUrl, qrCode, paymentLinkId } = paymentLinkData;

    // Upsert payment record (in case old failed one exists)
    await prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        payosOrderCode: BigInt(payosOrderCode),
        checkoutUrl,
        qrCode: qrCode || "",
        amount: order.total,
        currency: "VND",
        status: "PENDING",
      },
      update: {
        payosOrderCode: BigInt(payosOrderCode),
        checkoutUrl,
        qrCode: qrCode || "",
        status: "PENDING",
      },
    });

    res.json({
      success: true,
      data: {
        checkoutUrl,
        qrCode,
        paymentLinkId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: amountVND,
        expiresAt: order.expiresAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Get Payment Status ──────────────────────────────────────────────────
export async function getPaymentStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orderId = req.params.orderId as string;
    const buyerId = req.user!.userId;

    const order = await prisma.order.findFirst({
      where: { id: orderId, buyerId },
      include: { payment: { select: { status: true, checkoutUrl: true } } },
    });

    if (!order) throw createError("Order not found", 404);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderStatus: order.status,
        paymentStatus: order.payment?.status ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── PayOS Webhook Handler ───────────────────────────────────────────────
export async function handleWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    console.log("[PayOS Webhook] 📩 Webhook received payload:", JSON.stringify(req.body));

    // Return 200 OK for empty ping or health test
    if (!req.body || Object.keys(req.body).length === 0) {
      console.log("[PayOS Webhook] ℹ️ Empty ping received.");
      res.status(200).json({ success: true, message: "Webhook ping received" });
      return;
    }

    let webhookData: any = req.body.data || req.body;

    // Verify signature with PayOS SDK if payos client is configured and signature exists
    if (payos && req.body.signature) {
      try {
        webhookData = payos.webhooks.verify(req.body);
        console.log("[PayOS Webhook] ✅ Signature verified successfully with Checksum Key!");
      } catch (verifyErr: any) {
        console.warn("⚠️ [PayOS Webhook] Signature verification note:", verifyErr?.message || verifyErr);
        // If it's an explicit test ping from PayOS dashboard (orderCode 123456)
        if (req.body?.data?.orderCode === 123456 || req.body?.orderCode === 123456) {
          console.log("[PayOS Webhook] 🧪 Test verification ping from PayOS Dashboard confirmed.");
          res.status(200).json({ success: true, message: "PayOS Webhook test ping verified" });
          return;
        }
      }
    }

    const orderCode = webhookData?.orderCode || req.body?.data?.orderCode || req.body?.orderCode;
    const paymentCode = webhookData?.code || req.body?.data?.code || req.body?.code;
    const payosEventId = webhookData?.id || req.body?.data?.id || req.body?.id;
    const topLevelCode = req.body?.code;

    console.log(`[PayOS Webhook] 🔍 Extracted orderCode: ${orderCode}, paymentCode: ${paymentCode}, topLevelCode: ${topLevelCode}`);

    // Handle PayOS test payloads or missing orderCode
    if (!orderCode || orderCode === 123456) {
      console.log("[PayOS Webhook] 🧪 PayOS Test Payload acknowledged.");
      res.status(200).json({ success: true, message: "Webhook test payload received" });
      return;
    }

    let parsedOrderCode: bigint;
    try {
      parsedOrderCode = BigInt(orderCode);
    } catch {
      console.warn(`[PayOS Webhook] ⚠️ Cannot convert orderCode "${orderCode}" to BigInt.`);
      res.status(200).json({ success: true, message: "Invalid orderCode format, ignored" });
      return;
    }

    // Idempotency: skip if already processed successfully
    const idempotencyKey = String(payosEventId || orderCode);
    const existingTransaction = await prisma.transaction.findUnique({
      where: { payosEventId: idempotencyKey },
    });

    if (existingTransaction && existingTransaction.status === "SUCCEEDED") {
      console.log(`[PayOS Webhook] ℹ️ Webhook event ${idempotencyKey} already processed successfully.`);
      res.status(200).json({ success: true, message: "Already processed successfully" });
      return;
    }

    // Find payment by payosOrderCode
    const payment = await prisma.payment.findUnique({
      where: { payosOrderCode: parsedOrderCode },
      include: {
        order: {
          include: {
            items: { include: { ticketType: true, seat: true } },
            buyer: true,
            event: true,
          },
        },
      },
    });

    if (!payment) {
      console.warn(`[PayOS Webhook] ⚠️ Payment record not found in DB for payosOrderCode: ${orderCode}`);
      res.status(200).json({ success: true, message: "Payment record not found, ignored" });
      return;
    }

    const isSuccess = (topLevelCode === "00" || paymentCode === "00") && (webhookData?.desc === "success" || req.body?.desc === "success" || paymentCode === "00");

    console.log(`[PayOS Webhook] ⚙️ Processing payment result for Order #${payment.order.orderNumber} (ID: ${payment.orderId}). Success: ${isSuccess}`);

    await prisma.$transaction(async (tx) => {
      // Upsert transaction log
      await tx.transaction.upsert({
        where: { payosEventId: idempotencyKey },
        create: {
          paymentId: payment.id,
          payosEventId: idempotencyKey,
          type: isSuccess ? "PAYMENT_SUCCESS" : "PAYMENT_FAILED",
          amount: payment.amount,
          status: isSuccess ? "SUCCEEDED" : "FAILED",
          rawPayload: JSON.stringify(req.body),
        },
        update: {
          status: isSuccess ? "SUCCEEDED" : "FAILED",
          rawPayload: JSON.stringify(req.body),
        },
      });

      if (isSuccess) {
        // 1. Update Payment status to SUCCEEDED / PAID
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "SUCCEEDED", paidAt: new Date() },
        });

        // 2. Update Order status to CONFIRMED (PAID)
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: "CONFIRMED", confirmedAt: new Date() },
        });

        // 3. Issue Tickets: Ensure ticketCode exists & finalize inventory (reserved -> sold)
        for (const item of payment.order.items) {
          if (!item.ticketCode) {
            await tx.orderItem.update({
              where: { id: item.id },
              data: { ticketCode: generateTicketCode() },
            });
          }

          if (item.ticketTypeId) {
            await tx.ticketInventory.update({
              where: { ticketTypeId: item.ticketTypeId },
              data: { reservedQty: { decrement: 1 }, soldQty: { increment: 1 } },
            });
          }

          if (item.seatId) {
            await tx.seat.update({
              where: { id: item.seatId },
              data: { status: "SOLD", reservedBy: null, reservedAt: null, expiresAt: null },
            });
          }
        }

        // 4. Create Notification for Buyer
        await tx.notification.create({
          data: {
            userId: payment.order.buyerId,
            title: "Đặt vé thành công! 🎉",
            message: `Vé của bạn cho sự kiện "${payment.order.event.title}" đã được xác nhận. Mã đơn: ${payment.order.orderNumber}`,
            type: "ORDER_CONFIRMED",
            metadata: JSON.stringify({ orderId: payment.orderId }),
          },
        });

        // 5. Create Notification for Seller / Organizer
        if (payment.order.event.sellerId) {
          await tx.notification.create({
            data: {
              userId: payment.order.event.sellerId,
              title: "Đơn hàng mới! 🎫",
              message: `Đơn hàng #${payment.order.orderNumber} cho sự kiện "${payment.order.event.title}" vừa được thanh toán thành công.`,
              type: "SELLER_NEW_ORDER",
              metadata: JSON.stringify({ orderId: payment.orderId }),
            },
          });
        }

        console.log(`[PayOS Webhook] 🎉 ORDER CONFIRMED & TICKETS ISSUED SUCCESSFULLY! Order #${payment.order.orderNumber}`);
      } else {
        // Payment failed: Release all reserved seats and ticket inventories
        for (const item of payment.order.items) {
          if (item.seatId) {
            await tx.seat.update({
              where: { id: item.seatId },
              data: { status: "AVAILABLE", reservedBy: null, reservedAt: null, expiresAt: null },
            });
          }
          if (item.ticketTypeId) {
            const inv = await tx.ticketInventory.findUnique({
              where: { ticketTypeId: item.ticketTypeId },
            });
            if (inv) {
              await tx.ticketInventory.update({
                where: { ticketTypeId: item.ticketTypeId },
                data: { reservedQty: Math.max(0, inv.reservedQty - 1) },
              });
            }
          }
        }

        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: "CANCELLED" },
        });

        console.log(`[PayOS Webhook] ❌ Payment failed for Order #${payment.order.orderNumber}. Released seats and inventory.`);
      }
    });

    // Realtime Socket updates
    const io = getSocketIO();
    io.to(`user:${payment.order.buyerId}`).emit("order:confirmed", {
      orderId: payment.orderId,
      orderNumber: payment.order.orderNumber,
      status: isSuccess ? "CONFIRMED" : "FAILED",
    });

    io.to(`event:${payment.order.eventId}`).emit("inventory:update", {
      eventId: payment.order.eventId,
      reason: isSuccess ? "order_confirmed" : "payment_failed_released",
    });
    io.to(`event:${payment.order.eventId}`).emit("seats:update", {
      eventId: payment.order.eventId,
    });

    // Send order confirmation email asynchronously
    if (isSuccess) {
      sendOrderConfirmationEmail(payment.order).catch((err) =>
        console.error("[PayOS Webhook] Email error:", err)
      );
    }

    res.status(200).json({
      success: true,
      message: isSuccess
        ? "Thanh toán thành công. Đơn hàng đã được xác nhận và phát hành vé."
        : "Thanh toán không thành công. Ghế/vé đã được nhả lại.",
      data: {
        orderId: payment.orderId,
        orderNumber: payment.order.orderNumber,
        status: isSuccess ? "CONFIRMED" : "FAILED",
      },
    });
  } catch (err) {
    console.error("[PayOS Webhook Error]:", err);
    // Always return HTTP 200 OK so PayOS does not record a failed webhook delivery
    res.status(200).json({ success: true, message: "Webhook error handled gracefully" });
  }
}

// ─── Cancel Payment Link ─────────────────────────────────────────────────
export async function cancelPayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orderId = req.params.orderId as string;
    const buyerId = req.user!.userId;

    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: { order: { include: { items: true } } },
    });

    if (!payment || payment.order.buyerId !== buyerId) {
      throw createError("Payment not found", 404);
    }

    // Cancel on PayOS using official SDK
    if (payos) {
      try {
        await payos.paymentRequests.cancel(payment.payosOrderCode.toString());
      } catch (e) {
        console.warn("PayOS cancel failed, releasing locally:", e);
      }
    }

    // Release inventory + cancel order
    await releaseInventory(payment.order.items, orderId, payment.order.eventId);
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });

    res.json({ success: true, message: "Payment cancelled and inventory released" });
  } catch (err) {
    next(err);
  }
}
