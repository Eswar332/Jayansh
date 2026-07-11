import { db } from "@/db";
import { otpCodes } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, code } = body;

    if (!customerId || !code) {
      return NextResponse.json(
        { error: "Customer ID and OTP code are required" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Find a valid, unused, non-expired OTP for this customer
    const result = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.customerId, customerId),
          eq(otpCodes.code, code.trim()),
          eq(otpCodes.isUsed, false),
          gt(otpCodes.expiresAt, now)
        )
      )
      .limit(1);

    if (result.length === 0) {
      // Check if code exists but is expired
      const expired = await db
        .select()
        .from(otpCodes)
        .where(
          and(
            eq(otpCodes.customerId, customerId),
            eq(otpCodes.code, code.trim()),
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
        { error: "Invalid OTP code. Please try again." },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await db
      .update(otpCodes)
      .set({ isUsed: true })
      .where(eq(otpCodes.id, result[0].id));

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully!",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
