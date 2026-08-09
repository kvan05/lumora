// prisma/seed.js
// Lumora Database Seed — Idempotent (safe to run multiple times)
// Uses CommonJS (project type: "commonjs")

"use strict";

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const prisma = new PrismaClient();

// ─── Admin config ──────────────────────────────────────────────────────────────
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL || "admin@lumora.pro.vn";
const ADMIN_NAME     = "Lumora Admin";
const ADMIN_USERNAME = "lumora_admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// ─── Seller config ─────────────────────────────────────────────────────────────
const SELLER_EMAIL    = process.env.SELLER_EMAIL || "seller@lumora.pro.vn";
const SELLER_NAME     = "Lumora Seller";
const SELLER_USERNAME = "lumora_seller";
const SELLER_PASSWORD = process.env.SELLER_PASSWORD;

// ─── Default categories (Ticketing & Experience Platform) ──────────────────────
const DEFAULT_CATEGORIES = [
  // 🎵 Âm nhạc & Giải trí
  { name: "Concert & Live Show",       slug: "concert-live-show" },
  { name: "Music Festival",            slug: "music-festival" },
  { name: "Nightlife & Party",         slug: "nightlife" },
  { name: "Sân khấu & Kịch",           slug: "san-khau-kich" },
  { name: "Hài kịch & Stand-up",       slug: "comedy" },
  { name: "Phim ảnh & Cinema",         slug: "cinema" },
  { name: "Âm nhạc",                   slug: "am-nhac" }, // Legacy support

  // 🎨 Nghệ thuật & Văn hóa
  { name: "Triển lãm & Nghệ thuật",    slug: "trien-lam-nghe-thuat" },
  { name: "Bảo tàng & Di sản",         slug: "bao-tang-di-san" },
  { name: "Trải nghiệm văn hóa",       slug: "trai-nghiem-van-hoa" },
  { name: "Creative Workshop",         slug: "creative-workshop" },
  { name: "Nghệ thuật",                slug: "nghe-thuat" }, // Legacy support

  // ⚽ Thể thao & Sức khỏe
  { name: "Thể thao & Giải đấu",       slug: "the-thao" },
  { name: "Fitness & Yoga",            slug: "fitness-wellness" },
  { name: "Hoạt động ngoài trời",      slug: "outdoor-activities" },

  // 🎓 Học tập & Doanh nghiệp
  { name: "Workshop & Lớp học",        slug: "workshop" },
  { name: "Hội thảo & Summit",         slug: "hoi-thao-summit" },
  { name: "Networking & Kết nối",      slug: "networking" },
  { name: "Cộng đồng & Xã hội",        slug: "community" },
  { name: "Công nghệ",                 slug: "cong-nghe" }, // Legacy support
  { name: "Giáo dục",                  slug: "giao-duc" }, // Legacy support
  { name: "Hội nghị",                  slug: "hoi-nghi" }, // Legacy support

  // ✈️ Du lịch & Trải nghiệm
  { name: "City Tour & Bus 2 tầng",    slug: "city-tour" },
  { name: "Tham quan địa điểm",        slug: "sightseeing" },
  { name: "Tour & Trải nghiệm du lịch", slug: "travel-experience" },
  { name: "Water Bus & Du thuyền",     slug: "water-bus-cruise" },
  { name: "Tour tham quan",            slug: "tour" },
  { name: "Địa điểm du lịch",          slug: "attraction" },

  // 🎢 Vui chơi & Giải trí gia đình
  { name: "Công viên chủ đề",          slug: "theme-park" },
  { name: "Khu vui chơi giải trí",     slug: "amusement-park" },
  { name: "Hoạt động gia đình",        slug: "family-activities" },
  { name: "Vui chơi trẻ em",           slug: "kids-activities" },
  { name: "Giải trí tổng hợp",         slug: "entertainment" },

  // 🍽️ Ẩm thực
  { name: "Lễ hội Ẩm thực",            slug: "food-drink" },
  { name: "Food Tour & Khám phá",      slug: "food-tour" },
  { name: "Trải nghiệm ăn uống",       slug: "dining-experience" },
  { name: "Lớp học nấu ăn",            slug: "cooking-class" },
  { name: "Ẩm thực",                   slug: "am-thuc" }, // Legacy support

  // ❤️ Lifestyle & Sống đẹp
  { name: "Lifestyle & Phong cách sống", slug: "lifestyle" },
  { name: "Làm đẹp & Spa",             slug: "beauty-spa" },
  { name: "Sức khỏe & Wellness",       slug: "wellness" },
  { name: "Trải nghiệm xã hội",        slug: "social-experience" },

  // 📌 Khác
  { name: "Khác",                      slug: "khac" },
];

async function seedAdmin() {
  // Check if Admin already exists
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    console.log("ℹ️  Admin already exists. Skipping creation.");
    console.log(`   Email : ${existing.email}`);
    console.log(`   Role  : ${existing.role}`);
    return existing;
  }

  if (!ADMIN_PASSWORD) {
    throw new Error("Missing ADMIN_PASSWORD in environment variables. Please set ADMIN_PASSWORD in .env before running seed.");
  }

  // Hash password using bcryptjs (same lib as auth.controller.ts)
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admin = await prisma.user.create({
    data: {
      email:      ADMIN_EMAIL,
      username:   ADMIN_USERNAME,
      name:       ADMIN_NAME,
      password:   hashedPassword,
      role:       "ADMIN",
      isVerified: true,
      locale:     "vi",
    },
  });

  console.log("✅ Admin created:");
  console.log(`   Email    : ${admin.email}`);
  console.log(`   Username : ${admin.username}`);
  console.log(`   Role     : ${admin.role}`);
  console.log(`   Verified : ${admin.isVerified}`);
  console.log(`   Password : Configured from environment (hashed with bcryptjs)`);
  return admin;
}

async function seedSeller() {
  const existing = await prisma.user.findUnique({ where: { email: SELLER_EMAIL } });

  let seller;
  if (existing) {
    console.log("ℹ️  Seller user already exists.");
    console.log(`   Email : ${existing.email}`);
    console.log(`   Role  : ${existing.role}`);
    seller = existing;
    if (existing.role !== "SELLER") {
      seller = await prisma.user.update({
        where: { email: SELLER_EMAIL },
        data: { role: "SELLER" },
      });
      console.log(`   Updated role to SELLER`);
    }
  } else {
    if (!SELLER_PASSWORD) {
      throw new Error("Missing SELLER_PASSWORD in environment variables. Please set SELLER_PASSWORD in .env before running seed.");
    }

    const hashedPassword = await bcrypt.hash(SELLER_PASSWORD, 12);
    seller = await prisma.user.create({
      data: {
        email:      SELLER_EMAIL,
        username:   SELLER_USERNAME,
        name:       SELLER_NAME,
        password:   hashedPassword,
        role:       "SELLER",
        isVerified: true,
        locale:     "vi",
      },
    });

    console.log("✅ Seller created:");
    console.log(`   Email    : ${seller.email}`);
    console.log(`   Username : ${seller.username}`);
    console.log(`   Role     : ${seller.role}`);
    console.log(`   Verified : ${seller.isVerified}`);
    console.log(`   Password : Configured from environment (hashed with bcryptjs)`);
  }

  // Seed or update OrganizerProfile for seller
  const profile = await prisma.organizerProfile.upsert({
    where: { userId: seller.id },
    create: {
      userId: seller.id,
      orgName: SELLER_NAME,
      orgDescription: "Tài khoản Seller dùng cho môi trường test Lumora.",
      verifyStatus: "APPROVED",
    },
    update: {
      verifyStatus: "APPROVED",
    },
  });

  console.log(`   OrganizerProfile: ID ${profile.id} (verifyStatus: ${profile.verifyStatus})`);
  return seller;
}

async function seedCategories() {
  let created = 0;
  let updated = 0;

  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (existing) {
      await prisma.category.update({
        where: { slug: cat.slug },
        data: { name: cat.name },
      });
      updated++;
    } else {
      await prisma.category.create({ data: { name: cat.name, slug: cat.slug } });
      created++;
    }
  }

  console.log(`✅ Categories seeded: ${created} created, ${updated} confirmed/updated (${DEFAULT_CATEGORIES.length} total)`);
}

async function main() {
  console.log("\n🌱 Starting Lumora database seed...\n");
  console.log(`   DB: ${process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "unknown host"}`);
  console.log("");

  await seedAdmin();
  console.log("");
  await seedSeller();
  console.log("");
  await seedCategories();

  console.log("\n🌱 Database seed completed successfully.\n");
}

main()
  .catch((err) => {
    console.error("\n❌ Seed failed:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
