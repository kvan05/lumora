import { PrismaClient } from "@prisma/client";
import { sendEmail } from "./email";

const prisma = new PrismaClient();

/**
 * Generate a 6-digit OTP
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Creates and stores an OTP in the database, then sends it via email.
 */
export async function sendOtpEmail(email: string, type: "REGISTER" | "FORGOT_PASSWORD"): Promise<void> {
  const code = generateOtp();
  // Valid for 10 minutes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Invalidate any existing OTPs for this email and type
  await prisma.otp.deleteMany({
    where: { email, type },
  });

  // Save new OTP
  await prisma.otp.create({
    data: {
      email,
      code,
      type,
      expiresAt,
    },
  });

  // Log to console so developer can see the code without receiving email
  console.log(`\n🔑 [DEV ONLY] MÃ OTP CHO EMAIL ${email} LÀ: ${code}\n`);

  const subject = type === "REGISTER" 
    ? "Mã xác nhận đăng ký tài khoản Lumora" 
    : "Mã xác nhận đặt lại mật khẩu Lumora";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 10px;">
      <h2 style="color: #333; text-align: center;">Lumora</h2>
      <p style="color: #555; font-size: 16px;">Xin chào,</p>
      <p style="color: #555; font-size: 16px;">Bạn vừa yêu cầu ${type === "REGISTER" ? "đăng ký tài khoản mới" : "đặt lại mật khẩu"}. Dưới đây là mã xác nhận (OTP) của bạn:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; background-color: #EEF2FF; padding: 15px 30px; border-radius: 8px;">
          ${code}
        </span>
      </div>
      <p style="color: #555; font-size: 16px;">Mã này sẽ hết hạn trong <strong>10 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
      <hr style="border: none; border-top: 1px solid #eaeaec; margin: 30px 0;" />
      <p style="color: #999; font-size: 12px; text-align: center;">Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email này.</p>
    </div>
  `;

  await sendEmail(email, subject, html);
}

/**
 * Verify an OTP
 */
export async function verifyOtp(email: string, code: string, type: "REGISTER" | "FORGOT_PASSWORD"): Promise<boolean> {
  const otpRecord = await prisma.otp.findFirst({
    where: {
      email,
      code,
      type,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!otpRecord) return false;

  // Check expiration
  if (new Date() > otpRecord.expiresAt) {
    return false;
  }

  // Delete after successful verification
  await prisma.otp.delete({
    where: { id: otpRecord.id },
  });

  return true;
}
