"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useStore } from "@/context/StoreContext";

const STEPS = [
  { id: 1, label: "Personal", icon: "👤" },
  { id: 2, label: "Account", icon: "📧" },
  { id: 3, label: "Address", icon: "📍" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useStore();
  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Password strength meter
  useEffect(() => {
    const pw = form.password;
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    setPasswordStrength(score);
  }, [form.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.phone.trim().length < 10) {
      setError("Phone number is required and must be at least 10 digits");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          address: form.address,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      const otpRes = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: data.customer.id,
          email: data.customer.email,
          name: data.customer.name,
          purpose: "signup",
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
          purpose: "signup",
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

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const canGoNext = () => {
    if (step === 1)
      return form.name.trim().length >= 2 && form.phone.trim().length >= 10;
    if (step === 2)
      return (
        form.email.includes("@") &&
        form.password.length >= 6 &&
        form.password === form.confirmPassword
      );
    return true;
  };

  const strengthColor = ["bg-gray-200", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-400", "bg-green-600"];
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Excellent"];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-green-50 py-8 px-4 relative overflow-hidden">
      {/* Floating background decorations */}
      <div className="absolute top-10 left-10 text-6xl opacity-10 animate-float-slow select-none pointer-events-none">🥛</div>
      <div className="absolute top-32 right-16 text-5xl opacity-10 animate-float select-none pointer-events-none" style={{ animationDelay: "1s" }}>🧀</div>
      <div className="absolute bottom-20 left-20 text-5xl opacity-10 animate-float select-none pointer-events-none" style={{ animationDelay: "2s" }}>🧈</div>
      <div className="absolute bottom-40 right-10 text-6xl opacity-10 animate-float-slow select-none pointer-events-none" style={{ animationDelay: "0.5s" }}>🍶</div>
      <div className="absolute top-1/2 left-1/3 text-4xl opacity-5 animate-float select-none pointer-events-none" style={{ animationDelay: "1.5s" }}>🌿</div>

      <div className="max-w-2xl mx-auto relative">
        {/* Header with bounce animation */}
        <div className="text-center mb-8 animate-bounce-in">
          <div className="inline-block relative">
            <span className="text-6xl block animate-float">🥛</span>
            <div className="absolute -top-1 -right-3 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center animate-bounce-in stagger-3">
              <span className="text-white text-xs">✓</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 animate-slide-up stagger-1">
            Join <span className="text-blue-700">Milk</span>
            <span className="text-green-600">Fresh</span>
          </h1>
          <p className="text-gray-500 mt-2 animate-slide-up stagger-2">
            Fresh dairy delivered to your door — start in 3 easy steps
          </p>
        </div>

        {/* Step progress indicator */}
        <div className="flex items-center justify-center mb-8 animate-scale-in stagger-3">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => {
                  if (s.id < step || (s.id === step + 1 && canGoNext()))
                    setStep(s.id);
                }}
                className={`relative flex flex-col items-center transition-all duration-500 ${
                  s.id <= step ? "scale-100" : "scale-90 opacity-50"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-500 ${
                    s.id < step
                      ? "bg-green-500 shadow-lg shadow-green-200 ring-4 ring-green-100"
                      : s.id === step
                        ? "bg-blue-600 shadow-lg shadow-blue-200 ring-4 ring-blue-100 animate-pulse-glow"
                        : "bg-gray-200"
                  }`}
                >
                  {s.id < step ? (
                    <span className="text-white text-sm">✓</span>
                  ) : (
                    <span className={s.id === step ? "" : "grayscale"}>
                      {s.icon}
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs mt-1.5 font-medium transition-colors duration-300 ${
                    s.id <= step ? "text-blue-700" : "text-gray-400"
                  }`}
                >
                  {s.label}
                </span>
              </button>
              {idx < STEPS.length - 1 && (
                <div className="w-16 sm:w-24 h-1 mx-2 rounded-full bg-gray-200 overflow-hidden mb-5">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-700 ease-out"
                    style={{ width: step > s.id ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 overflow-hidden animate-slide-up stagger-4">
          {/* Gradient accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-green-500 animate-gradient" />

          <div className="p-6 sm:p-8">
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-6 text-sm font-medium flex items-center gap-3 animate-scale-in border border-red-100">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span>⚠️</span>
                </div>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Step 1: Personal Info */}
              <div
                className={`transition-all duration-500 ${
                  step === 1
                    ? "opacity-100 translate-x-0 max-h-[500px]"
                    : "opacity-0 translate-x-8 max-h-0 overflow-hidden absolute pointer-events-none"
                }`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl animate-bounce-in">
                    👤
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Personal Information
                    </h3>
                    <p className="text-xs text-gray-500">
                      Tell us about yourself
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="animate-slide-up stagger-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => updateForm("name", e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3.5 pl-11 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                        placeholder="Enter your full name"
                      />
                      <span className="absolute left-3.5 top-3.5 text-gray-400">👤</span>
                      {form.name.length >= 2 && (
                        <span className="absolute right-3 top-3.5 text-green-500 animate-scale-in">✓</span>
                      )}
                    </div>
                  </div>

                  <div className="animate-slide-up stagger-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Phone Number <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) =>
                          updateForm("phone", e.target.value.replace(/[^0-9+\-\s]/g, ""))
                        }
                        className="w-full border border-gray-200 rounded-xl px-4 py-3.5 pl-11 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                        placeholder="+91 xxxxxxxxxx"
                      />
                      <span className="absolute left-3.5 top-3.5 text-gray-400">📱</span>
                      {form.phone.trim().length >= 10 && (
                        <span className="absolute right-3 top-3.5 text-green-500 animate-scale-in">✓</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Required for delivery updates and order contact.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2: Account Details */}
              <div
                className={`transition-all duration-500 ${
                  step === 2
                    ? "opacity-100 translate-x-0 max-h-[700px]"
                    : "opacity-0 -translate-x-8 max-h-0 overflow-hidden absolute pointer-events-none"
                }`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-xl animate-bounce-in">
                    📧
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Account Details
                    </h3>
                    <p className="text-xs text-gray-500">
                      Set up your login credentials
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="animate-slide-up stagger-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => updateForm("email", e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3.5 pl-11 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                        placeholder="you@example.com"
                      />
                      <span className="absolute left-3.5 top-3.5 text-gray-400">✉️</span>
                      {form.email.includes("@") && form.email.includes(".") && (
                        <span className="absolute right-3 top-3.5 text-green-500 animate-scale-in">✓</span>
                      )}
                    </div>
                  </div>

                  <div className="animate-slide-up stagger-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Password <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={form.password}
                        onChange={(e) => updateForm("password", e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3.5 pl-11 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                        placeholder="Min 6 characters"
                      />
                      <span className="absolute left-3.5 top-3.5 text-gray-400">🔒</span>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition"
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {/* Strength meter */}
                    {form.password && (
                      <div className="mt-2 animate-fade-in">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                                i <= passwordStrength
                                  ? strengthColor[passwordStrength]
                                  : "bg-gray-100"
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs font-medium ${
                          passwordStrength <= 1 ? "text-red-500" :
                          passwordStrength <= 2 ? "text-orange-500" :
                          passwordStrength <= 3 ? "text-yellow-600" :
                          "text-green-600"
                        }`}>
                          {strengthLabel[passwordStrength]}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="animate-slide-up stagger-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Confirm Password <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={form.confirmPassword}
                        onChange={(e) =>
                          updateForm("confirmPassword", e.target.value)
                        }
                        className={`w-full border rounded-xl px-4 py-3.5 pl-11 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${
                          form.confirmPassword && form.password !== form.confirmPassword
                            ? "border-red-300 focus:ring-red-500"
                            : form.confirmPassword && form.password === form.confirmPassword
                              ? "border-green-300 focus:ring-green-500"
                              : "border-gray-200 focus:ring-blue-500 hover:border-blue-300"
                        }`}
                        placeholder="Repeat password"
                      />
                      <span className="absolute left-3.5 top-3.5 text-gray-400">🔐</span>
                      {form.confirmPassword && form.password === form.confirmPassword && (
                        <span className="absolute right-3 top-3.5 text-green-500 animate-scale-in">✓</span>
                      )}
                      {form.confirmPassword && form.password !== form.confirmPassword && (
                        <span className="absolute right-3 top-3.5 text-red-500 animate-scale-in">✗</span>
                      )}
                    </div>
                    {form.confirmPassword && form.password === form.confirmPassword && (
                      <p className="text-xs text-green-600 mt-1 animate-fade-in">✅ Passwords match</p>
                    )}
                    {form.confirmPassword && form.password !== form.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1 animate-fade-in">Passwords don&apos;t match</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 3: Address */}
              <div
                className={`transition-all duration-500 ${
                  step === 3
                    ? "opacity-100 translate-x-0 max-h-[600px]"
                    : "opacity-0 translate-x-8 max-h-0 overflow-hidden absolute pointer-events-none"
                }`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl animate-bounce-in">
                    📍
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Delivery Address
                    </h3>
                    <p className="text-xs text-gray-500">
                      Optional — you can add this later too
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="animate-slide-up stagger-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Street Address
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) => updateForm("address", e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3.5 pl-11 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                        placeholder="123 Main Street"
                      />
                      <span className="absolute left-3.5 top-3.5 text-gray-400">🏠</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="animate-slide-up stagger-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        City
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => updateForm("city", e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                        placeholder="City"
                      />
                    </div>
                    <div className="animate-slide-up stagger-3">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        State
                      </label>
                      <input
                        type="text"
                        value={form.state}
                        onChange={(e) => updateForm("state", e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                        placeholder="State"
                      />
                    </div>
                    <div className="animate-slide-up stagger-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        PIN Code
                      </label>
                      <input
                        type="text"
                        value={form.zipCode}
                        onChange={(e) => updateForm("zipCode", e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                        placeholder="110001"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex gap-3 mt-8">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold transition-all duration-300 hover:shadow-md active:scale-[0.98]"
                  >
                    ← Back
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => canGoNext() && setStep(step + 1)}
                    disabled={!canGoNext()}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3.5 rounded-xl font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-200 active:scale-[0.98]"
                  >
                    Continue →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3.5 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:shadow-green-200 active:scale-[0.98] relative overflow-hidden group"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating Account...
                      </span>
                    ) : (
                      <>
                        <span className="relative z-10">🚀 Create Account</span>
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>

            {/* OTP info banner */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 animate-slide-up stagger-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center animate-float-slow flex-shrink-0">
                  🔐
                </div>
                <p className="text-xs text-blue-700">
                  After registration, you&apos;ll receive a <strong>6-digit OTP</strong> on your email for verification.
                </p>
              </div>
            </div>

            {/* Login link */}
            <p className="text-center text-sm text-gray-500 mt-6 animate-slide-up stagger-6">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors"
              >
                Login here →
              </Link>
            </p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex justify-center gap-6 mt-8 animate-slide-up stagger-6">
          {[
            { icon: "🔒", label: "Secure" },
            { icon: "⚡", label: "Fast" },
            { icon: "🌿", label: "Fresh" },
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
