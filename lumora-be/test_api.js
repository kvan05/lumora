const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const order = await prisma.order.findFirst({
    where: { id: "cmsu29q6d0006qbhhjgpny53s" }
  });
  console.log("Order from DB:", order);
}
main().catch(console.error).finally(() => prisma.$disconnect());
