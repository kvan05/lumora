const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Đang xóa tất cả dữ liệu sự kiện mẫu, đơn hàng, vé, thanh toán...");

  try {
    if (prisma.orderItem) await prisma.orderItem.deleteMany({});
    if (prisma.payment) await prisma.payment.deleteMany({});
    if (prisma.transaction) await prisma.transaction.deleteMany({});
    if (prisma.order) await prisma.order.deleteMany({});
    if (prisma.review) await prisma.review.deleteMany({});
    if (prisma.refundRequest) await prisma.refundRequest.deleteMany({});
    if (prisma.report) await prisma.report.deleteMany({});
    if (prisma.seat) await prisma.seat.deleteMany({});
    if (prisma.seatRow) await prisma.seatRow.deleteMany({});
    if (prisma.seatSection) await prisma.seatSection.deleteMany({});
    if (prisma.ticketInventory) await prisma.ticketInventory.deleteMany({});
    if (prisma.ticketType) await prisma.ticketType.deleteMany({});
    if (prisma.favorite) await prisma.favorite.deleteMany({});
    if (prisma.eventApprovalLog) await prisma.eventApprovalLog.deleteMany({});
    if (prisma.event) await prisma.event.deleteMany({});

    console.log("🎉 ĐÃ XÓA SẠCH 100% SỰ KIỆN MẪU VÀ ĐƠN HÀNG TRONG CƠ SỞ DỮ LIỆU!");
  } catch (error) {
    console.error("❌ Lỗi khi xóa dữ liệu:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
