import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import prisma from "../prisma/client";
import { createError } from "../middleware/errorHandler";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getExpiryDate,
} from "../utils/jwt";
import { sendEmail } from "../utils/email";

// Helper: Generate 6-digit numeric OTP
function generate6DigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: Validate password strength (min 8 chars, 1 upper, 1 lower, 1 number)
function validatePasswordStrength(password: string): boolean {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return minLength && hasUpper && hasLower && hasNumber;
}

// ─── 1. Register (Step 1: Save EmailVerification & Send OTP via Resend) ─────
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw createError("Họ tên, email và mật khẩu là bắt buộc", 400, "VALIDATION_ERROR");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createError("Định dạng email không hợp lệ", 400, "INVALID_EMAIL");
    }

    // Validate password strength
    if (!validatePasswordStrength(password)) {
      throw createError(
        "Mật khẩu phải chứa tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số",
        400,
        "WEAK_PASSWORD"
      );
    }

    // Check if user with this email already exists and is verified
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.isVerified) {
      throw createError("Email này đã được sử dụng. Vui lòng đăng nhập", 409, "EMAIL_EXISTS");
    }

    // Generate 6-digit OTP & 5 minutes expiry
    const otp = generate6DigitOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
    const hashedPassword = await bcrypt.hash(password, 12);

    // Save or update in EmailVerification table
    await prisma.emailVerification.upsert({
      where: { email },
      create: {
        email,
        otp,
        password: hashedPassword,
        name: name.trim(),
        expiresAt,
      },
      update: {
        otp,
        password: hashedPassword,
        name: name.trim(),
        expiresAt,
        createdAt: new Date(),
      },
    });

    // Log to console for dev environment
    console.log(`\n🔑 [RESEND OTP LOG] Email: ${email} | Mã OTP: ${otp}\n`);

    // Send OTP via Resend API
    const htmlTemplate = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 16px; border: 1px solid #f0e8e6;">
        <h2 style="color: #6B403B; text-align: center; margin-top: 0;">✨ Lumora</h2>
        <p style="color: #333; font-size: 16px;">Xin chào <strong>${name}</strong>,</p>
        <p style="color: #555; font-size: 15px;">Mã xác thực tài khoản của bạn là:</p>
        <div style="text-align: center; margin: 28px 0;">
          <span style="display: inline-block; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #E11D48; background-color: #FFE4E6; padding: 16px 36px; border-radius: 12px; font-family: monospace;">
            ${otp}
          </span>
        </div>
        <p style="color: #555; font-size: 14px;">Mã có hiệu lực trong <strong>5 phút</strong>.</p>
        <p style="color: #888; font-size: 13px; margin-top: 24px; border-top: 1px solid #eee; pt-16px;">Если bạn không thực hiện thao tác này, vui lòng bỏ qua email này.</p>
      </div>
    `;

    await sendEmail(email, "Xác thực tài khoản Lumora", htmlTemplate);

    res.status(200).json({
      success: true,
      email,
      message: "Mã OTP đã được gửi về email của bạn. Vui lòng xác thực trong 5 phút.",
    });
  } catch (err) {
    next(err);
  }
}

// ─── 2. Verify Email OTP & Create User Account ────────────────────────────────
export async function verifyEmailOtp(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw createError("Email và mã OTP là bắt buộc", 400, "VALIDATION_ERROR");
    }

    const verificationRecord = await prisma.emailVerification.findUnique({ where: { email } });

    if (!verificationRecord) {
      throw createError("Yêu cầu xác thực không tồn tại hoặc đã hết hạn", 400, "INVALID_OTP");
    }

    if (new Date() > verificationRecord.expiresAt) {
      throw createError("Mã OTP đã hết hạn. Vui lòng bấm gửi lại mã", 400, "OTP_EXPIRED");
    }

    if (verificationRecord.otp !== otp.trim()) {
      throw createError("Mã OTP không chính xác. Vui lòng kiểm tra lại", 400, "WRONG_OTP");
    }

    // OTP Verified! Create or update User in DB
    const existingUser = await prisma.user.findUnique({ where: { email } });

    let user;
    if (existingUser) {
      user = await prisma.user.update({
        where: { email },
        data: {
          name: verificationRecord.name,
          password: verificationRecord.password,
          isVerified: true,
        },
        select: { id: true, email: true, name: true, role: true, isVerified: true },
      });
    } else {
      const defaultUsername = email.split("@")[0] + "_" + Math.floor(1000 + Math.random() * 9000);
      user = await prisma.user.create({
        data: {
          email,
          username: defaultUsername,
          name: verificationRecord.name,
          password: verificationRecord.password,
          isVerified: true,
          role: "BUYER",
        },
        select: { id: true, email: true, name: true, role: true, isVerified: true },
      });
    }

    // Delete EmailVerification record
    await prisma.emailVerification.delete({ where: { email } });

    res.status(200).json({
      success: true,
      message: "Xác thực tài khoản thành công! Vui lòng đăng nhập.",
      data: user,
    });
  } catch (err) {
    next(err);
  }
}

// ─── 3. Resend OTP ─────────────────────────────────────────────────────────────
export async function resendOtp(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) throw createError("Email là bắt buộc", 400);

    const record = await prisma.emailVerification.findUnique({ where: { email } });
    if (!record) {
      throw createError("Không tìm thấy thông tin đăng ký cho email này. Vui lòng đăng ký lại", 404);
    }

    // Cooldown check (60 seconds)
    const diff = Date.now() - new Date(record.createdAt).getTime();
    if (diff < 60000) {
      const remainingSeconds = Math.ceil((60000 - diff) / 1000);
      throw createError(`Vui lòng đợi ${remainingSeconds} giây trước khi bấm gửi lại mã`, 429);
    }

    // Generate new OTP & refresh 5-minute expiry
    const newOtp = generate6DigitOtp();
    const newExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.emailVerification.update({
      where: { email },
      data: {
        otp: newOtp,
        expiresAt: newExpiresAt,
        createdAt: new Date(),
      },
    });

    console.log(`\n🔑 [RESEND NEW OTP LOG] Email: ${email} | Mã OTP Mới: ${newOtp}\n`);

    const htmlTemplate = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 16px; border: 1px solid #f0e8e6;">
        <h2 style="color: #6B403B; text-align: center; margin-top: 0;">✨ Lumora</h2>
        <p style="color: #333; font-size: 16px;">Xin chào <strong>${record.name}</strong>,</p>
        <p style="color: #555; font-size: 15px;">Mã xác thực mới của bạn là:</p>
        <div style="text-align: center; margin: 28px 0;">
          <span style="display: inline-block; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #E11D48; background-color: #FFE4E6; padding: 16px 36px; border-radius: 12px; font-family: monospace;">
            ${newOtp}
          </span>
        </div>
        <p style="color: #555; font-size: 14px;">Mã có hiệu lực trong <strong>5 phút</strong>.</p>
      </div>
    `;

    await sendEmail(email, "Xác thực tài khoản Lumora", htmlTemplate);

    res.json({
      success: true,
      message: "Mã OTP mới đã được gửi về email của bạn.",
    });
  } catch (err) {
    next(err);
  }
}

// ─── 4. Login (Email + Password) ──────────────────────────────────────────────
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { password, rememberMe } = req.body;
    const rawIdentifier = req.body.identifier || req.body.email || req.body.username;

    if (!rawIdentifier || !password) {
      throw createError("Vui lòng nhập email/tên đăng nhập và mật khẩu", 400, "VALIDATION_ERROR");
    }

    const trimmedIdentifier = String(rawIdentifier).trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: trimmedIdentifier }, { username: trimmedIdentifier }],
      },
    });

    if (!user) {
      throw createError("Tài khoản hoặc mật khẩu không chính xác", 401, "INVALID_CREDENTIALS");
    }

    if (!user.password) {
      throw createError("Tài khoản này được đăng ký bằng Google. Vui lòng bấm Đăng nhập bằng Google", 400, "OAUTH_USER");
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw createError("Tài khoản hoặc mật khẩu không chính xác", 401, "INVALID_CREDENTIALS");
    }

    // Check if email is verified
    if (!user.isVerified) {
      throw createError("Vui lòng xác minh email trước khi đăng nhập", 403, "EMAIL_NOT_VERIFIED");
    }

    // For STAFF accounts: check isActive in StaffMember table
    if (user.role === "STAFF") {
      const staffMember = await prisma.staffMember.findFirst({
        where: { userId: user.id },
      });
      if (!staffMember) {
        throw createError("Tài khoản nhân viên không hợp lệ", 403, "FORBIDDEN");
      }
      if (!staffMember.isActive) {
        throw createError(
          "Tài khoản của bạn đã bị khóa bởi Seller. Vui lòng liên hệ quản lý để được mở khóa.",
          403,
          "ACCOUNT_LOCKED"
        );
      }
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload, rememberMe ? "30d" : "1d");
    const refreshToken = generateRefreshToken(payload);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        token: accessToken,
        expiresAt: getExpiryDate(rememberMe ? "30d" : "1d"),
      },
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── 5. Google OAuth Login (No OTP required for Google) ────────────────────────
export async function oauth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, name, avatar } = req.body;

    if (!email || !name) {
      throw createError("Email và tên là bắt buộc cho Google OAuth", 400);
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create user immediately for Google OAuth with isVerified = true (No OTP!)
      const rawPrefix = email.split("@")[0] || "user";
      const sanitizedPrefix = rawPrefix.replace(/[^a-zA-Z0-9_]/g, "") || "user";
      const defaultUsername = (sanitizedPrefix + "_" + Math.floor(1000 + Math.random() * 9000)).slice(0, 30);

      user = await prisma.user.create({
        data: {
          email,
          username: defaultUsername,
          name: name || "Google User",
          avatar: avatar || null,
          role: "BUYER",
          isVerified: true,
          password: null,
        },
      });
    } else if (!user.isVerified) {
      // Mark verified if logged in via Google
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        token: accessToken,
        expiresAt: getExpiryDate("1d"),
      },
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Other Endpoints ─────────────────────────────────────────────────────────

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken: token } = req.body;
    if (!token) throw createError("Refresh token required", 400);

    const payload = verifyRefreshToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true },
    });
    if (!user) throw createError("User not found", 404);

    const newPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(newPayload);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        token: accessToken,
        expiresAt: getExpiryDate("1d"),
      },
    });

    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      await prisma.userSession.deleteMany({ where: { token } });
    }
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        phone: true,
        role: true,
        locale: true,
        isVerified: true,
        createdAt: true,
      },
    });
    if (!user) throw createError("User not found", 404);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, phone, avatar, locale } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { name, phone, avatar, locale },
      select: { id: true, email: true, username: true, name: true, avatar: true, phone: true, locale: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user?.password) throw createError("Password not set (OAuth account)", 400);

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw createError("Current password is incorrect", 400, "WRONG_PASSWORD");

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    await prisma.userSession.deleteMany({ where: { userId: user.id } });
    res.json({ success: true, message: "Password changed. Please log in again." });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    await prisma.$transaction([
      prisma.userSession.deleteMany({ where: { userId } }),
      prisma.favorite.deleteMany({ where: { userId } }),
      prisma.notification.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);
    res.json({ success: true, message: "Tài khoản của bạn đã được xóa thành công." });
  } catch (err) {
    next(err);
  }
}

export async function becomeOrganizer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const existing = await prisma.organizerProfile.findUnique({ where: { userId } });
    if (existing) {
      if (existing.verifyStatus === "APPROVED") throw createError("Tài khoản của bạn đã là Nhà tổ chức sự kiện.", 400);
      if (existing.verifyStatus === "PENDING") throw createError("Đơn đăng ký của bạn đang chờ xét duyệt.", 400);
      await prisma.organizerProfile.delete({ where: { userId } });
    }

    const {
      orgName, orgLogo, orgBanner, orgDescription, businessCategory, website, facebook,
      address, representative, bankName, accountNumber, accountHolder,
      documents = [], agreeTerms,
    } = req.body;

    if (!orgName || !representative || !businessCategory || !bankName || !accountNumber || !accountHolder) {
      throw createError("Vui lòng điền đầy đủ thông tin bắt buộc (bao gồm Tên tổ chức, Người đại diện, Lĩnh vực kinh doanh, Địa chỉ và Tài khoản ngân hàng)", 400);
    }
    if (!agreeTerms) throw createError("Bạn cần đồng ý với Điều khoản bán vé của Lumora", 400);

    const profile = await prisma.organizerProfile.create({
      data: {
        userId,
        orgName, orgLogo, orgBanner, orgDescription, businessCategory, website, facebook,
        address, representative,
        verifyStatus: "PENDING",
        bankInfo: { create: { bankName, accountNumber, accountHolder } },
        documents: {
          create: documents.map((doc: { docType: string; docUrl: string }) => ({
            docType: doc.docType, docUrl: doc.docUrl,
          })),
        },
      },
      include: { bankInfo: true, documents: true },
    });

    res.status(201).json({
      success: true,
      data: profile,
      message: "Đã gửi đơn đăng ký. Admin sẽ xét duyệt trong 1-3 ngày làm việc.",
    });
  } catch (err) {
    next(err);
  }
}

export async function getOrganizerStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
      include: { bankInfo: true, documents: true },
    });
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) throw createError("Email là bắt buộc", 400);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.json({ success: true, message: "Nếu email tồn tại, OTP sẽ được gửi." });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.emailVerification.upsert({
      where: { email },
      create: { email, otp, password: "", name: user.name || "User", expiresAt },
      update: { otp, expiresAt, createdAt: new Date() },
    });

    const htmlTemplate = `<div style="font-family: Arial; padding: 20px;"><h2>Đặt lại mật khẩu</h2><p>Mã OTP: <b>${otp}</b></p></div>`;
    await sendEmail(email, "Đặt lại mật khẩu Lumora", htmlTemplate);

    res.json({ success: true, message: "Đã gửi mã OTP tới email của bạn." });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) throw createError("Thiếu thông tin bắt buộc", 400);

    const record = await prisma.emailVerification.findUnique({ where: { email } });
    if (!record || record.otp !== otp.trim() || new Date() > record.expiresAt) {
      throw createError("Mã OTP không hợp lệ hoặc đã hết hạn", 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    await prisma.emailVerification.delete({ where: { email } });
    res.json({ success: true, message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại." });
  } catch (err) {
    next(err);
  }
}
