"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("milkfresh_reset_password");
    if (!stored) {
      router.push("/forgot-password");
      return;
    }
    try {
      const data = JSON.parse(stored);
      setCustomerId(data.customerId);
      setEmail(data.email);
    } catch {
      router.push("/forgot-password");
    }
  }, [router]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, [customerId]);

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError("");
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || "";
      }
      setOtp(newOtp);
      const focusIdx = Math.min(pasted.length, 5);
      inputRefs.current[focusIdx]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          code,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Reset failed");
        if (data.error?.includes("expired") || data.error?.includes("Invalid")) {
          setOtp(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        }
        return;
      }

      sessionStorage.removeItem("milkfresh_reset_password");
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const [resendTimer, setResendTimer] = useState(60);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const resendOtp = async () => {
    if (resendTimer > 0 || !email) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setResendTimer(60);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        setError("");
      }
    } catch {
      // ignore
    } finally {
      setResending(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center animate-fade-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Password Reset!
          </h2>
          <p className="text-gray-500 mb-6">
            Your password has been changed successfully. You can now login with
            your new password.
          </p>
          <Link
            href="/login"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition text-center"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (!customerId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-xl">Loading...</div>
      </div>
    );
  }

  const maskedEmail = email.replace(
    /^(.{2})(.*)(@.*)$/,
    (_, a, b, c) => a + "•".repeat(b.length) + c
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🔐</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reset Password
          </h1>
          <p className="text-gray-500 mt-2">
            Enter the OTP sent to{" "}
            <span className="font-medium text-blue-600">{maskedEmail}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-6 text-sm font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP boxes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                Enter 6-digit OTP
              </label>
              <div
                className="flex justify-center gap-3"
                onPaste={handlePaste}
              >
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 focus:outline-none transition-all ${
                      digit
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-200 bg-gray-50 text-gray-900"
                    } focus:border-red-600 focus:ring-2 focus:ring-red-200`}
                  />
                ))}
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 text-sm"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Repeat password"
              />
              {confirmPassword &&
                newPassword &&
                confirmPassword !== newPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    Passwords do not match
                  </p>
                )}
              {confirmPassword &&
                newPassword &&
                confirmPassword === newPassword && (
                  <p className="text-xs text-green-600 mt-1">✅ Passwords match</p>
                )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition disabled:bg-blue-400"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          {/* Resend */}
          <div className="mt-5 text-center">
            {resendTimer > 0 ? (
              <p className="text-sm text-gray-500">
                Resend OTP in{" "}
                <span className="font-bold text-blue-600">
                  {Math.floor(resendTimer / 60)}:
                  {String(resendTimer % 60).padStart(2, "0")}
                </span>
              </p>
            ) : (
              <button
                onClick={resendOtp}
                disabled={resending}
                className="text-sm text-blue-600 hover:text-blue-800 font-semibold transition disabled:text-blue-400"
              >
                {resending ? "Sending..." : "📨 Resend OTP"}
              </button>
            )}
          </div>

          {/* Help */}
          <div className="mt-5 p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 text-center">
              💡 Check your email inbox, spam folder, or the 📬 Notifications
              page in the app for the OTP.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link
            href="/login"
            className="text-blue-600 hover:underline font-medium"
          >
            ← Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
