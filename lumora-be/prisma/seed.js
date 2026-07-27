const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@lumora.vn' },
    update: {},
    create: {
      email: 'admin@lumora.vn',
      name: 'Admin Lumora',
      role: 'ADMIN',
      isVerified: true,
      username: 'admin',
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: 'seller@lumora.vn' },
    update: {},
    create: {
      email: 'seller@lumora.vn',
      name: 'Lumora Events',
      role: 'SELLER',
      isVerified: true,
      username: 'lumora_events',
    },
  });

  const eventsData = [
    {
      title: 'Live Concert Sky Dec',
      slug: 'live-concert-sky-dec-2026',
      description: 'Đêm nhạc cuối năm với những ca khúc bất hủ.',
      category: 'Âm nhạc',
      venue: 'Sân vận động Phú Thọ',
      address: 'Quận 11',
      city: 'TP. HCM',
      startDate: new Date('2026-08-15T19:00:00.000Z'),
      endDate: new Date('2026-08-15T23:00:00.000Z'),
      status: 'PENDING',
      sellerId: seller.id,
    },
    {
      title: 'Tech Summit Vietnam 2026',
      slug: 'tech-summit-vn-2026',
      description: 'Sự kiện công nghệ lớn nhất miền Bắc.',
      category: 'Workshop',
      venue: 'Trung tâm Hội nghị quốc gia',
      address: 'Nam Từ Liêm',
      city: 'Hà Nội',
      startDate: new Date('2026-09-01T08:00:00.000Z'),
      endDate: new Date('2026-09-02T17:00:00.000Z'),
      status: 'PENDING',
      sellerId: seller.id,
    }
  ];

  for (const data of eventsData) {
    await prisma.event.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    });
  }

  console.log('Seeding completed successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
