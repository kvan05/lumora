const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const res = await prisma.event.updateMany({
    where: {
      status: { in: ['APPROVED', 'PENDING', 'PENDING_APPROVAL', 'DRAFT'] },
    },
    data: {
      status: 'PUBLISHED',
      isFeatured: true,
    },
  });
  console.log(`✅ Đã cập nhật ${res.count} sự kiện sang trạng thái PUBLISHED và isFeatured = true.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
