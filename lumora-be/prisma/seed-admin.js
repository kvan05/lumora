const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@lumora.vn";
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error("Missing ADMIN_PASSWORD in environment variables. Please configure ADMIN_PASSWORD in .env before running seed.");
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        role: "ADMIN",
        password: hashedPassword,
        isVerified: true,
      },
    });
    console.log(`\n✅ Đã cập nhật mật khẩu và quyền ADMIN cho tài khoản: ${adminEmail}`);
  } else {
    await prisma.user.create({
      data: {
        email: adminEmail,
        username: "admin_lumora",
        name: "Quản trị viên Lumora",
        password: hashedPassword,
        role: "ADMIN",
        isVerified: true,
      },
    });
    console.log(`\n🎉 Đã tạo tài khoản ADMIN mới thành công: ${adminEmail}`);
  }

  console.log(`
🔑 THÔNG TIN ĐĂNG NHẬP TRANG ADMIN:
- ĐƯỜNG DẪN: http://localhost:3000/login
- EMAIL: ${adminEmail}
- MẬT KHẨU: [Cấu hình trong file .env]
- VÀO TRANG ADMIN: http://localhost:3000/admin
  `);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
