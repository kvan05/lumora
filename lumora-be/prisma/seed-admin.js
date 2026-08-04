const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@lumora.vn";
  const adminPassword = "Admin123456@";
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
- MẬT KHẨU: ${adminPassword}
- VÀO TRANG ADMIN: http://localhost:3000/admin
  `);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
