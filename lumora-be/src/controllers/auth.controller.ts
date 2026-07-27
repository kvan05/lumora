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
import { sendOtpEmail, verifyOtp } from "../utils/otp";

// ─── Register Step 1 (Send OTP) ─────────────────────────────────────────
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, username, password, name, role = "BUYER" } = req.body;

    if (!email || !username || !password || !name) {
      throw createError("Email, username, password and name are required", 400, "VALIDATION_ERROR");
    }

    // Only BUYER and SELLER roles allowed on self-register
    const validRoles = ["BUYER", "SELLER"];
    if (!validRoles.includes(role)) {
      throw createError("Invalid role", 400, "INVALID_ROLE");
    }

    // Check email
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw createError("Email đã tồn tại", 409, "EMAIL_EXISTS");
    }

    // Check username
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      throw createError("Username đã tồn tại", 409, "USERNAME_EXISTS");
    }

    // Generate verify token and send email
    try {
      await sendOtpEmail(email, "REGISTER");
    } catch (e) {
      console.error("Failed to send OTP email:", e);
      throw createError("Lỗi khi gửi email xác thực.", 500);
    }

    res.status(200).json({ 
      success: true, 
      requiresOtp: true,
      message: "Đã gửi mã xác thực tới email. Vui lòng kiểm tra hộp thư." 
    });
  } catch (err) {
    next(err);
  }
}

// ─── Register Step 2 (Verify OTP & Create User) ─────────────────────────
export async function verifyRegisterOtp(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, otp, username, password, name, role = "BUYER" } = req.body;

    if (!email || !otp || !username || !password || !name) {
      throw createError("Missing required fields", 400, "VALIDATION_ERROR");
    }

    // Verify OTP
    const isValid = await verifyOtp(email, otp, "REGISTER");
    if (!isValid) {
      throw createError("Mã xác thực không đúng hoặc đã hết hạn.", 400, "INVALID_OTP");
    }

    // Double check email/username existence before creating
    const existing = await prisma.user.findFirst({
      where: {
        OR: [ { email }, { username } ]
      }
    });
    if (existing) {
      throw createError("Email hoặc Username đã được sử dụng.", 409, "USER_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, username, password: hashedPassword, name, role, isVerified: true },
      select: { id: true, email: true, username: true, name: true, role: true, avatar: true },
    });

    res.status(201).json({ 
      success: true, 
      message: "Tạo tài khoản thành công!", 
      data: user 
    });
  } catch (err) {
    next(err);
  }
}


// ─── Become Organizer (Multi-step registration) ──────────────────────────
export async function becomeOrganizer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    // Check if already applied
    const existing = await prisma.organizerProfile.findUnique({ where: { userId } });
    if (existing) {
      if (existing.verifyStatus === "APPROVED") {
        throw createError("Tài khoản của bạn đã là Nhà tổ chức sự kiện.", 400);
      }
      if (existing.verifyStatus === "PENDING") {
        throw createError("Đơn đăng ký của bạn đang chờ xét duyệt.", 400);
      }
      // If REJECTED — allow re-apply by deleting old one
      await prisma.organizerProfile.delete({ where: { userId } });
    }

    const {
      orgName, orgLogo, orgBanner, orgDescription, website, facebook,
      address, representative,
      // Bank info
      bankName, accountNumber, accountHolder,
      // Documents
      documents = [], // [{ docType: 'CCCD', docUrl: '...' }]
      agreeTerms,
    } = req.body;

    if (!orgName || !representative || !bankName || !accountNumber || !accountHolder) {
      throw createError("Vui lòng điền đầy đủ thông tin bắt buộc", 400);
    }
    if (!agreeTerms) {
      throw createError("Bạn cần đồng ý với Điều khoản bán vé của Lumora", 400);
    }

    const profile = await prisma.organizerProfile.create({
      data: {
        userId,
        orgName, orgLogo, orgBanner, orgDescription, website, facebook,
        address, representative,
        verifyStatus: "PENDING",
        bankInfo: {
          create: { bankName, accountNumber, accountHolder },
        },
        documents: {
          create: documents.map((doc: { docType: string; docUrl: string }) => ({
            docType: doc.docType,
            docUrl: doc.docUrl,
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
// ─── Login ─────────────────────────────────────────────────────────────
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // identifier can be email or username
    const { identifier, password, rememberMe } = req.body;

    if (!identifier || !password) {
      throw createError("Email/Username and password are required", 400, "VALIDATION_ERROR");
    }

    const user = await prisma.user.findFirst({ 
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });

    if (!user || !user.password) {
      throw createError("Tài khoản hoặc mật khẩu không chính xác", 401, "INVALID_CREDENTIALS");
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw createError("Tài khoản hoặc mật khẩu không chính xác", 401, "INVALID_CREDENTIALS");
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload, rememberMe ? "30d" : "1d");
    const refreshToken = generateRefreshToken(payload);

    // Persist session
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

// ─── OAuth Login (Google) ──────────────────────────────────────────────
export async function oauth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, name, avatar, provider } = req.body;

    if (!email || !name) {
      throw createError("Email and name are required for OAuth", 400);
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // User doesn't exist -> Send OTP to their email and request verification
      await sendOtpEmail(email, "REGISTER");
      
      res.json({
        success: true,
        requiresOtp: true,
        message: "Cần xác thực email để tạo tài khoản bằng Google.",
      });
      return;
    }

    // User exists -> Login normally
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

// ─── Verify OAuth OTP & Create User ──────────────────────────────────────
export async function verifyOauthOtp(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, otp, name, avatar, provider } = req.body;

    if (!email || !otp || !name) {
      throw createError("Missing required fields", 400, "VALIDATION_ERROR");
    }

    const isValid = await verifyOtp(email, otp, "REGISTER");
    if (!isValid) {
      throw createError("Mã xác thực không đúng hoặc đã hết hạn.", 400, "INVALID_OTP");
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        avatar,
        role: "BUYER",
        isVerified: true,
        // For OAuth users without username chosen, we can auto-generate one or leave null
        username: email.split("@")[0] + "_" + Math.floor(Math.random() * 10000),
      },
    });

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

// ─── Forgot Password (Send OTP) ────────────────────────────────────────
export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) throw createError("Email is required", 400);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success to prevent enumeration
      res.json({ success: true, message: "Nếu email đã đăng ký, OTP sẽ được gửi." });
      return;
    }

    try {
      await sendOtpEmail(email, "FORGOT_PASSWORD");
    } catch (e) {
      console.error("Failed to send reset email:", e);
      throw createError("Lỗi khi gửi email", 500);
    }

    res.json({ success: true, message: "Đã gửi mã OTP tới email của bạn." });
  } catch (err) {
    next(err);
  }
}

// ─── Reset Password (Verify OTP & Change) ──────────────────────────────
export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      throw createError("Missing required fields", 400);
    }

    const isValid = await verifyOtp(email, otp, "FORGOT_PASSWORD");
    if (!isValid) {
      throw createError("Mã xác thực không đúng hoặc đã hết hạn.", 400, "INVALID_OTP");
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { email },
      data: { password: hashed },
    });

    res.json({ success: true, message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập." });
  } catch (err) {
    next(err);
  }
}

// ─── Other Endpoints ───────────────────────────────────────────────────

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Logic remains same (omitted for brevity, assume implemented properly)
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

