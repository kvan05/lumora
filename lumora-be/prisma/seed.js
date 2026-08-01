const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seeding dữ liệu...');

  // ─── Admin Account ───────────────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lumora.vn' },
    update: {
      password: adminPasswordHash,
      role: 'ADMIN',
      isVerified: true,
    },
    create: {
      email: 'admin@lumora.vn',
      name: 'Admin Lumora',
      role: 'ADMIN',
      isVerified: true,
      username: 'admin',
      password: adminPasswordHash,
    },
  });
  console.log(`✅ Admin tạo thành công: ${admin.email}`);

  // ─── Seller/Organizer Demo Account ───────────────────────────────────────────
  const sellerPasswordHash = await bcrypt.hash('Seller@123456', 10);
  const seller = await prisma.user.upsert({
    where: { email: 'seller@lumora.vn' },
    update: {
      password: sellerPasswordHash,
      role: 'SELLER',
      isVerified: true,
    },
    create: {
      email: 'seller@lumora.vn',
      name: 'Lumora Events',
      role: 'SELLER',
      isVerified: true,
      username: 'lumora_events',
      password: sellerPasswordHash,
    },
  });
  console.log(`✅ Seller tạo thành công: ${seller.email}`);

  // ─── Buyer Demo Account ───────────────────────────────────────────────────────
  const buyerPasswordHash = await bcrypt.hash('Buyer@123456', 10);
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@lumora.vn' },
    update: {
      password: buyerPasswordHash,
      isVerified: true,
    },
    create: {
      email: 'buyer@lumora.vn',
      name: 'Người dùng Demo',
      role: 'BUYER',
      isVerified: true,
      username: 'demo_buyer',
      password: buyerPasswordHash,
    },
  });
  console.log(`✅ Buyer tạo thành công: ${buyer.email}`);

  // ─── Sample Events ────────────────────────────────────────────────────────────
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
    },
    {
      title: 'Marathon TP.HCM 2026',
      slug: 'marathon-tphcm-2026',
      description: 'Giải chạy marathon thường niên của thành phố.',
      category: 'Thể thao',
      venue: 'Nhà Hát Lớn',
      address: 'Quận 1',
      city: 'TP. HCM',
      startDate: new Date('2026-11-15T05:00:00.000Z'),
      endDate: new Date('2026-11-15T10:00:00.000Z'),
      status: 'APPROVED',
      sellerId: seller.id,
    },
  ];

  for (const data of eventsData) {
    await prisma.event.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    });
  }
  console.log(`✅ ${eventsData.length} sự kiện mẫu đã được tạo.`);

  console.log('\n🎉 Seeding hoàn tất!');
  console.log('─────────────────────────────────────────');
  console.log('📋 Thông tin đăng nhập:');
  console.log('  Admin   → admin@lumora.vn   / Admin@123456');
  console.log('  Seller  → seller@lumora.vn  / Seller@123456');
  console.log('  Buyer   → buyer@lumora.vn   / Buyer@123456');
  console.log('─────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
