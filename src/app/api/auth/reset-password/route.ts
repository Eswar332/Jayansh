import { db } from "@/db";
import { customers, otpCodes } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, code, newPassword } = body;

    if (!customerId || !code || !newPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Verify OTP
    const otpResult = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.customerId, customerId),
          eq(otpCodes.code, code.trim()),
          eq(otpCodes.purpose, "reset_password"),
          eq(otpCodes.isUsed, false),
          gt(otpCodes.expiresAt, now)
        )
      )
      .limit(1);

    if (otpResult.length === 0) {
      // Check if expired
      const expired = await db
        .select()
        .from(otpCodes)
        .where(
          and(
            eq(otpCodes.customerId, customerId),
            eq(otpCodes.code, code.trim()),
            eq(otpCodes.purpose, "reset_password"),
            eq(otpCodes.isUsed, false)
          )
        )
        .limit(1);

      if (expired.length > 0) {
        return NextResponse.json(
          { error: "OTP has expired. Please request a new one." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Invalid OTP code." },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await db
      .update(otpCodes)
      .set({ isUsed: true })
      .where(eq(otpCodes.id, otpResult[0].id));

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db
      .update(customers)
      .set({ passwordHash })
      .where(eq(customers.id, customerId));

    return NextResponse.json({
      success: true,
      message: "Password reset successfully! You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
