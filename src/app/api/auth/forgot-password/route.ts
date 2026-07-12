import { db } from "@/db";
import { customers, otpCodes, notifications } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function buildResetOtpEmailHtml(name: string, otp: string): string {
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:500px;margin:0 auto;background:#f8fafc">
      <div style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:35px 30px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:26px">🥛 MilkFresh</h1>
        <p style="color:#fecaca;margin:6px 0 0;font-size:14px">Password Reset</p>
      </div>
      <div style="background:white;padding:35px 30px;border:1px solid #e5e7eb;border-top:none">
        <p style="color:#374151;font-size:16px;margin:0 0 10px">Hello <strong>${name}</strong>,</p>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 25px">
          We received a request to reset your password. Use the following OTP to proceed. This code is valid for <strong>10 minutes</strong>.
        </p>
        <div style="background:linear-gradient(135deg,#fef2f2,#fee2e2);padding:25px;border-radius:16px;text-align:center;border:2px dashed #ef4444;margin:0 0 25px">
          <p style="margin:0;color:#dc2626;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Password Reset OTP</p>
          <p style="margin:10px 0 0;font-size:40px;font-weight:800;color:#991b1b;letter-spacing:12px;font-family:monospace">${otp}</p>
        </div>
        <div style="background:#fef3c7;padding:14px 18px;border-radius:10px;border:1px solid #fde68a">
          <p style="margin:0;color:#92400e;font-size:13px">
            ⚠️ If you did not request a password reset, please ignore this email. Your account is safe.
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
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Look up customer
    const result = await db
      .select({ id: customers.id, name: customers.name, email: customers.email })
      .from(customers)
      .where(eq(customers.email, email.toLowerCase().trim()))
      .limit(1);

    if (result.length === 0) {
      // Don't reveal whether the email exists
      return NextResponse.json({
        success: true,
        message: "If an account with that email exists, an OTP has been sent.",
      });
    }

    const customer = result[0];

    // Invalidate previous unused OTPs
    const now = new Date();
    await db
      .update(otpCodes)
      .set({ isUsed: true })
      .where(
        and(
          eq(otpCodes.customerId, customer.id),
          eq(otpCodes.purpose, "reset_password"),
          eq(otpCodes.isUsed, false),
          gt(otpCodes.expiresAt, now)
        )
      );

    // Generate OTP (10 min expiry for password reset)
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.insert(otpCodes).values({
      customerId: customer.id,
      email: customer.email,
      code,
      purpose: "reset_password",
      isUsed: false,
      expiresAt,
    });

    // Send email
    const subject = `🔑 MilkFresh Password Reset OTP: ${code}`;
    const htmlBody = buildResetOtpEmailHtml(customer.name, code);
    let emailSent = false;

    try {
      const { sendEmail } = await import("@/lib/email");
      const result = await sendEmail(customer.email, subject, htmlBody);
      emailSent = result.sent;
    } catch {
      // email send failed, but OTP is saved as notification
    }

    // Save as in-app notification
    try {
      await db.insert(notifications).values({
        customerId: customer.id,
        type: "otp",
        subject,
        htmlBody,
        orderNumber: null,
        isRead: false,
        emailSent,
        emailError: emailSent ? null : "Check Notifications for OTP",
      });
    } catch {
      // non-critical
    }

    return NextResponse.json({
      success: true,
      customerId: customer.id,
      email: customer.email,
      message: emailSent
        ? "OTP sent to your email. Check your inbox."
        : "OTP ready. Check your Notifications (📬) in the app.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
