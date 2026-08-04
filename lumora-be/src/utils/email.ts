import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "noreply@lumora.vn";

interface OrderWithDetails {
  orderNumber: string;
  total: any;
  confirmedAt?: Date | null;
  buyer: { email: string; name: string | null };
  event: { title: string; startDate: Date; venue: string; city: string };
  items: Array<{
    ticketCode: string | null;
    unitPrice: any;
    ticketType?: { name: string } | null;
    seat?: { seatLabel: string; row?: { section?: { name: string } | null } | null } | null;
  }>;
}

/**
 * Send booking confirmation email with ticket details via Resend
 */
export async function sendOrderConfirmationEmail(order: OrderWithDetails): Promise<void> {
  const ticketRows = order.items
    .map((item) => {
      const name = item.ticketType?.name || item.seat?.seatLabel || "Ticket";
      const section = item.seat?.row?.section?.name || "";
      return `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0e8e6;">${name}${section ? ` (${section})` : ""}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0e8e6; text-align: right;">${Number(item.unitPrice).toLocaleString("vi-VN")} ₫</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0e8e6; font-family: monospace; color: #6B403B;">${item.ticketCode || "-"}</td>
        </tr>
      `;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="margin:0; padding:0; background-color:#FAF7F4; font-family: 'Segoe UI', Arial, sans-serif; color: #6B403B;">
      <div style="max-width: 600px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(107,64,59,0.08);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #F7DDD5 0%, #D8A4AF 100%); padding: 32px 40px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: #6B403B; letter-spacing: -0.5px;">✨ Lumora</h1>
          <p style="margin: 8px 0 0; color: #6B403B; opacity: 0.8; font-size: 14px;">Light Up Life's Best Moments</p>
        </div>

        <!-- Content -->
        <div style="padding: 32px 40px;">
          <h2 style="margin: 0 0 8px; color: #6B403B;">Booking Confirmed! 🎉</h2>
          <p style="color: #8D6B68; margin: 0 0 24px;">Hi ${order.buyer.name || "there"}, your tickets are ready!</p>

          <!-- Event Info -->
          <div style="background: #FAF7F4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px; color: #6B403B; font-size: 18px;">${order.event.title}</h3>
            <p style="margin: 4px 0; color: #8D6B68;">📅 ${new Date(order.event.startDate).toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
            <p style="margin: 4px 0; color: #8D6B68;">📍 ${order.event.venue}, ${order.event.city}</p>
            <p style="margin: 8px 0 0; color: #6B403B;"><strong>Order #${order.orderNumber}</strong></p>
          </div>

          <!-- Tickets -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background: #F7DDD5;">
                <th style="padding: 10px 12px; text-align: left; color: #6B403B; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Ticket</th>
                <th style="padding: 10px 12px; text-align: right; color: #6B403B; font-size: 12px; text-transform: uppercase;">Price</th>
                <th style="padding: 10px 12px; text-align: left; color: #6B403B; font-size: 12px; text-transform: uppercase;">Code</th>
              </tr>
            </thead>
            <tbody>${ticketRows}</tbody>
            <tfoot>
              <tr>
                <td colspan="1" style="padding: 12px; font-weight: bold; color: #6B403B;">Total</td>
                <td style="padding: 12px; text-align: right; font-weight: bold; color: #6B403B;">${Number(order.total).toLocaleString("vi-VN")} ₫</td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          <!-- Note -->
          <div style="border-left: 4px solid #D8A4AF; padding: 12px 16px; background: #FFF5F3; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 13px; color: #8D6B68;">
              🎫 Please present your ticket code or QR code at the venue entrance.
              View your tickets anytime in your <a href="${process.env.FRONTEND_URL}/orders/${order.orderNumber}" style="color: #D8A4AF;">Lumora account</a>.
            </p>
          </div>

          <a href="${process.env.FRONTEND_URL}/orders" style="display: inline-block; background: linear-gradient(135deg, #D8A4AF, #F7DDD5); color: #6B403B; text-decoration: none; padding: 14px 28px; border-radius: 50px; font-weight: 600; font-size: 15px;">View My Tickets →</a>
        </div>

        <!-- Footer -->
        <div style="background: #FAF7F4; padding: 20px 40px; text-align: center; border-top: 1px solid #f0e8e6;">
          <p style="margin: 0; font-size: 12px; color: #B89C9A;">© ${new Date().getFullYear()} Lumora. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: FROM,
    to: order.buyer.email,
    subject: `✅ Booking Confirmed — ${order.event.title} | Lumora`,
    html,
  });
}

/**
 * Generic sendEmail function for OTP & notifications via Resend
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const fromEmail = process.env.EMAIL_FROM || "noreply@lumora.pro.vn";
  
  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (error) {
      console.warn(`Resend failed with ${fromEmail}, trying fallback onboarding@resend.dev...`, error.message);
      const fallbackResult = await resend.emails.send({
        from: "onboarding@resend.dev",
        to,
        subject,
        html,
      });
      if (fallbackResult.error) {
        console.error("Resend Fallback Error:", fallbackResult.error);
      } else {
        console.log("Email sent successfully via Resend fallback. ID:", fallbackResult.data?.id);
        return;
      }
    } else {
      console.log("Email successfully sent via Resend. ID:", data?.id);
    }
  } catch (err: any) {
    console.error("Resend Email Execution Error:", err?.message || err);
  }
}

/**
 * Send email verification link
 */
export async function sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="margin:0; padding:0; background-color:#FAF7F4; font-family: 'Segoe UI', Arial, sans-serif; color: #6B403B;">
      <div style="max-width: 600px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(107,64,59,0.08);">
        
        <div style="background: linear-gradient(135deg, #F7DDD5 0%, #D8A4AF 100%); padding: 32px 40px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: #6B403B; letter-spacing: -0.5px;">✨ Lumora</h1>
        </div>

        <div style="padding: 32px 40px; text-align: center;">
          <h2 style="margin: 0 0 16px; color: #6B403B;">Xác thực tài khoản của bạn</h2>
          <p style="color: #8D6B68; margin: 0 0 24px; font-size: 16px;">
            Chào ${name}, cảm ơn bạn đã đăng ký tài khoản tại Lumora.<br/>
            Vui lòng nhấn vào nút bên dưới để xác thực địa chỉ email của bạn.
          </p>
          <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #D8A4AF, #F7DDD5); color: #6B403B; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">Xác thực Email</a>
          <p style="margin: 24px 0 0; color: #B89C9A; font-size: 13px;">
            Nếu bạn không yêu cầu tạo tài khoản, xin vui lòng bỏ qua email này.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Xác thực tài khoản Lumora`,
    html,
  });
}

/**
 * Send password reset link
 */
export async function sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="margin:0; padding:0; background-color:#FAF7F4; font-family: 'Segoe UI', Arial, sans-serif; color: #6B403B;">
      <div style="max-width: 600px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(107,64,59,0.08);">
        
        <div style="background: linear-gradient(135deg, #F7DDD5 0%, #D8A4AF 100%); padding: 32px 40px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: #6B403B; letter-spacing: -0.5px;">✨ Lumora</h1>
        </div>

        <div style="padding: 32px 40px; text-align: center;">
          <h2 style="margin: 0 0 16px; color: #6B403B;">Đặt lại mật khẩu</h2>
          <p style="color: #8D6B68; margin: 0 0 24px; font-size: 16px;">
            Chào ${name}, chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.<br/>
            Nhấn vào nút bên dưới để thiết lập mật khẩu mới (Link có hiệu lực trong 15 phút).
          </p>
          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #D8A4AF, #F7DDD5); color: #6B403B; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">Đặt lại mật khẩu</a>
          <p style="margin: 24px 0 0; color: #B89C9A; font-size: 13px;">
            Nếu bạn không yêu cầu, mật khẩu của bạn vẫn an toàn.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Đặt lại mật khẩu Lumora`,
    html,
  });
}

