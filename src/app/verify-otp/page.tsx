"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { useStore, type Customer } from "@/context/StoreContext";

export default function VerifyOtpPage() {
  const router = useRouter();
  const { setCustomer, showToast } = useStore();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingCustomer, setPendingCustomer] = useState<Customer | null>(null);
  const [purpose, setPurpose] = useState("login");
  const [resendTimer, setResendTimer] = useState(60);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load pending auth data
  useEffect(() => {
    const stored = sessionStorage.getItem("milkfresh_pending_auth");
    if (!stored) {
      router.push("/login");
      return;
    }
    try {
      const data = JSON.parse(stored);
      setPendingCustomer(data.customer);
      setPurpose(data.purpose || "login");
    } catch {
      router.push("/login");
    }
  }, [router]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Focus first input on load
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, [pendingCustomer]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
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
      // Focus the last filled input or the next empty one
      const focusIdx = Math.min(pasted.length, 5);
      inputRefs.current[focusIdx]?.focus();
    }
  };

  const verifyOtp = useCallback(async () => {
    if (!pendingCustomer) return;

    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: pendingCustomer.id,
          code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      // OTP verified — log the user in
      setCustomer(pendingCustomer);
      sessionStorage.removeItem("milkfresh_pending_auth");

      showToast(
        purpose === "signup"
          ? "Account verified! Welcome to MilkFresh! 🎉"
          : `Welcome back, ${pendingCustomer.name}!`
      );
      router.push("/products");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [otp, pendingCustomer, purpose, setCustomer, showToast, router]);

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otp.every((d) => d !== "") && !loading) {
      verifyOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const resendOtp = async () => {
    if (!pendingCustomer || resendTimer > 0) return;
    setResending(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: pendingCustomer.id,
          email: pendingCustomer.email,
          name: pendingCustomer.name,
          purpose,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(data.message, "info");
        setResendTimer(60);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setError(data.error || "Failed to resend OTP");
      }
    } catch {
      setError("Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  if (!pendingCustomer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-xl">Loading...</div>
      </div>
    );
  }

  const maskedEmail =
    pendingCustomer.email.replace(
      /^(.{2})(.*)(@.*)$/,
      (_, a, b, c) => a + "•".repeat(b.length) + c
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🔐</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Verify Your Email
          </h1>
          <p className="text-gray-500 mt-2">
            {purpose === "signup"
              ? "We sent a verification code to your email"
              : "Enter the OTP sent to your email"}
          </p>
          <p className="text-blue-600 font-medium mt-1 text-sm">
            {maskedEmail}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-6 text-sm font-medium text-center">
              {error}
            </div>
          )}

          {/* OTP Input boxes */}
          <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
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
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 focus:outline-none transition-all ${
                  digit
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-gray-50 text-gray-900"
                } focus:border-blue-600 focus:ring-2 focus:ring-blue-200`}
              />
            ))}
          </div>

          {/* Verify button */}
          <button
            onClick={verifyOtp}
            disabled={loading || otp.some((d) => d === "")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition disabled:bg-blue-300"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin w-5 h-5"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Verifying...
              </span>
            ) : (
              "Verify OTP"
            )}
          </button>

          {/* Timer & Resend */}
          <div className="mt-6 text-center">
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

          {/* Info box */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex gap-3 items-start">
              <span className="text-lg">💡</span>
              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  <strong>Didn&apos;t receive the OTP?</strong>
                </p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Check your spam / junk folder</li>
                  <li>
                    Check the 📬 Notifications page in the app (OTP is saved
                    there too)
                  </li>
                  <li>Wait for the timer and click Resend OTP</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Back link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Wrong email?{" "}
          <button
            onClick={() => {
              sessionStorage.removeItem("milkfresh_pending_auth");
              router.push(purpose === "signup" ? "/register" : "/login");
            }}
            className="text-blue-600 hover:underline font-medium"
          >
            Go back
          </button>
        </p>
      </div>
    </div>
  );
}
