"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useStore } from "@/context/StoreContext";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      const otpRes = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: data.customer.id,
          email: data.customer.email,
          name: data.customer.name,
          purpose: "login",
        }),
      });

      const otpData = await otpRes.json();

      if (!otpRes.ok) {
        setError(otpData.error || "Failed to send OTP");
        return;
      }

      sessionStorage.setItem(
        "milkfresh_pending_auth",
        JSON.stringify({
          customer: data.customer,
          purpose: "login",
        })
      );

      showToast(otpData.message, "info");
      router.push("/verify-otp");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-green-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating background decorations */}
      <div
        className="absolute top-12 left-8 text-7xl opacity-10 animate-float-slow select-none pointer-events-none"
        style={{ animationDelay: "0s" }}
      >
        🥛
      </div>
      <div
        className="absolute top-24 right-12 text-5xl opacity-10 animate-float select-none pointer-events-none"
        style={{ animationDelay: "1.2s" }}
      >
        🧀
      </div>
      <div
        className="absolute bottom-16 left-16 text-5xl opacity-10 animate-float select-none pointer-events-none"
        style={{ animationDelay: "0.7s" }}
      >
        🧈
      </div>
      <div
        className="absolute bottom-32 right-8 text-6xl opacity-10 animate-float-slow select-none pointer-events-none"
        style={{ animationDelay: "2s" }}
      >
        🍶
      </div>
      <div
        className="absolute top-1/2 left-1/4 text-4xl opacity-5 animate-float select-none pointer-events-none"
        style={{ animationDelay: "1.5s" }}
      >
        🌿
      </div>

      {/* Decorative blurred circles */}
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-green-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />

      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block relative animate-bounce-in">
            <span className="text-6xl block animate-float">🥛</span>
            <div className="absolute -bottom-1 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-bounce-in stagger-3 shadow-lg shadow-blue-200">
              <span className="text-white text-xs">🔑</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-5 animate-slide-up stagger-1">
            Welcome Back
          </h1>
          <p className="text-gray-500 mt-2 animate-slide-up stagger-2">
            Login to your{" "}
            <span className="font-semibold text-blue-700">Milk</span>
            <span className="font-semibold text-green-600">Fresh</span>{" "}
            account
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 overflow-hidden animate-slide-up stagger-3">
          {/* Gradient accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-green-500 animate-gradient" />

          <div className="p-7 sm:p-8">
            {/* Error */}
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-6 text-sm font-medium flex items-center gap-3 animate-scale-in border border-red-100">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span>⚠️</span>
                </div>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="animate-slide-up stagger-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div
                  className={`relative transition-all duration-300 ${
                    focusedField === "email"
                      ? "transform scale-[1.02]"
                      : ""
                  }`}
                >
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3.5 pl-11 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                    placeholder="you@example.com"
                  />
                  <span
                    className={`absolute left-3.5 top-3.5 transition-transform duration-300 ${
                      focusedField === "email" ? "scale-125" : ""
                    }`}
                  >
                    ✉️
                  </span>
                  {form.email.includes("@") && form.email.includes(".") && (
                    <span className="absolute right-3 top-3.5 text-green-500 animate-scale-in">
                      ✓
                    </span>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="animate-slide-up stagger-2">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors group"
                  >
                    Forgot Password?
                    <span className="inline-block transition-transform group-hover:translate-x-0.5">
                      {" "}
                      →
                    </span>
                  </Link>
                </div>
                <div
                  className={`relative transition-all duration-300 ${
                    focusedField === "password"
                      ? "transform scale-[1.02]"
                      : ""
                  }`}
                >
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3.5 pl-11 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                    placeholder="••••••••"
                  />
                  <span
                    className={`absolute left-3.5 top-3.5 transition-transform duration-300 ${
                      focusedField === "password" ? "scale-125" : ""
                    }`}
                  >
                    🔒
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="animate-slide-up stagger-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3.5 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:shadow-blue-200 active:scale-[0.98] relative overflow-hidden group"
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
                    <>
                      <span className="relative z-10">Login →</span>
                      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* OTP info */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 animate-slide-up stagger-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center animate-float-slow flex-shrink-0">
                  🔐
                </div>
                <p className="text-xs text-blue-700">
                  You&apos;ll receive a <strong>6-digit OTP</strong> on your
                  email for secure verification after login.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6 animate-slide-up stagger-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">
                New to MilkFresh?
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Register link */}
            <div className="animate-slide-up stagger-6">
              <Link
                href="/register"
                className="block w-full text-center bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-green-700 py-3.5 rounded-xl font-semibold transition-all duration-300 border border-green-200 hover:border-green-300 hover:shadow-md hover:shadow-green-100 active:scale-[0.98] group"
              >
                Create an Account
                <span className="inline-block transition-transform group-hover:translate-x-1 ml-1">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex justify-center gap-6 mt-8 animate-slide-up stagger-6">
          {[
            { icon: "🔒", label: "Encrypted" },
            { icon: "⚡", label: "Instant" },
            { icon: "🛡️", label: "Secure OTP" },
          ].map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-1.5 text-gray-400 text-xs"
            >
              <span className="text-base">{badge.icon}</span>
              <span>{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
