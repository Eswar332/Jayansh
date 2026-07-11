import { db } from "@/db";
import { otpCodes, notifications } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function buildOtpEmailHtml(name: string, otp: string): string {
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:500px;margin:0 auto;background:#f8fafc">
      <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:35px 30px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:26px">🥛 MilkFresh</h1>
        <p style="color:#bfdbfe;margin:6px 0 0;font-size:14px">Email Verification</p>
      </div>
      <div style="background:white;padding:35px 30px;border:1px solid #e5e7eb;border-top:none">
        <p style="color:#374151;font-size:16px;margin:0 0 10px">Hello <strong>${name}</strong>,</p>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 25px">
          Use the following OTP to verify your identity. This code is valid for <strong>5 minutes</strong>.
        </p>
        <div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);padding:25px;border-radius:16px;text-align:center;border:2px dashed #3b82f6;margin:0 0 25px">
          <p style="margin:0;color:#1e40af;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Your OTP Code</p>
          <p style="margin:10px 0 0;font-size:40px;font-weight:800;color:#1e3a8a;letter-spacing:12px;font-family:monospace">${otp}</p>
        </div>
        <div style="background:#fef3c7;padding:14px 18px;border-radius:10px;border:1px solid #fde68a">
          <p style="margin:0;color:#92400e;font-size:13px">
            ⚠️ <strong>Do not share this code</strong> with anyone. MilkFresh team will never ask for your OTP.
          </p>
        </div>
      </div>
      <div style="padding:20px;text-align:center;background:#f1f5f9;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p style="color:#94a3b8;font-size:11px;margin:0">© 2026 MilkFresh — Fresh Dairy, Delivered with Care 🌿</p>
      </div>
    </div>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, email, name, purpose } = body;

    if (!customerId || !email || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Invalidate any existing unused OTPs for this customer
    const now = new Date();
    await db
      .update(otpCodes)
      .set({ isUsed: true })
      .where(
        and(
          eq(otpCodes.customerId, customerId),
          eq(otpCodes.isUsed, false),
          gt(otpCodes.expiresAt, now)
        )
      );

    // Generate new OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await db.insert(otpCodes).values({
      customerId,
      email,
      code,
      purpose: purpose || "login",
      isUsed: false,
      expiresAt,
    });

    // Send OTP via email (uses configured SMTP)
    const subject = `🔐 Your MilkFresh OTP: ${code}`;
    const htmlBody = buildOtpEmailHtml(name, code);
    let emailSent = false;
    let emailError: string | null = null;

    try {
      const { sendEmail } = await import("@/lib/email");
      const result = await sendEmail(email, subject, htmlBody);
      emailSent = result.sent;
      emailError = result.error;
    } catch {
      emailError = "Email module error";
    }

    // Always save as in-app notification so user can see OTP
    try {
      await db.insert(notifications).values({
        customerId,
        type: "otp",
        subject,
        htmlBody,
        orderNumber: null,
        isRead: false,
        emailSent,
        emailError,
      });
    } catch {
      // notification save failure is non-critical
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? `OTP sent to ${email}. Check your inbox.`
        : `OTP ready. Check your Notifications (📬) in the app.`,
      emailSent,
      expiresInSeconds: 300,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
