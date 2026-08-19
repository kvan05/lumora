const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const id = "cmsu29q6d0006qbhhjgpny53s";
  const buyerId = "cmsklmfoc0007qv6sesqyt7z6"; // from previous query

  const order = await prisma.order.findFirst({
    where: { id, buyerId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
          bannerUrl: true,
          startDate: true,
          endDate: true,
          venue: true,
          city: true,
          category: true,
        },
      },
      buyer: {
        select: { id: true, name: true, email: true },
      },
      items: {
        include: {
          ticketType: { select: { id: true, name: true, price: true } },
          seat: {
            include: {
              row: { include: { section: { select: { id: true, name: true } } } },
            },
          },
        },
      },
      payment: true,
      RefundRequest: true,
    },
  });
  console.log("Order fetched:", order ? "YES" : "NO");
}
main().catch(console.error).finally(() => prisma.$disconnect());
