"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Lock, Mail } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    } else {
      router.push("/admin/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex bg-[#070c2e]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-[#0a1040] border-r border-white/5 p-10">
        <div>
          <div className="mb-12">
            <Image
              src="/eva/evanepal.png"
              alt="EVA Nepal"
              width={140}
              height={90}
              className="brightness-0 invert h-10 w-auto"
              priority
            />
          </div>
          <h2 className="text-2xl font-bold text-white leading-tight mb-3">
            Event & Venue<br />Association Nepal
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            The official industry body for event venues in Kathmandu Valley since 2011.
          </p>
        </div>

        {/* Decorative stats */}
        <div className="space-y-3">
          {[
            { label: "Member Venues", value: "150+" },
            { label: "Years Active", value: "13+" },
            { label: "Location", value: "Kathmandu" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-white/5">
              <span className="text-white/40 text-sm">{label}</span>
              <span className="text-amber-400 font-semibold text-sm">{value}</span>
            </div>
          ))}
        </div>

        <p className="text-white/20 text-xs">© EVA Nepal Admin Panel</p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image
              src="/eva/evanepal.png"
              alt="EVA Nepal"
              width={120}
              height={77}
              className="brightness-0 invert h-9 w-auto"
              priority
            />
          </div>

          <div className="bg-white rounded-2xl shadow-2xl shadow-black/40 p-8">
            <div className="mb-7">
              <h1 className="text-xl font-bold text-gray-900 mb-1">Sign in</h1>
              <p className="text-sm text-gray-500">Access the EVA Nepal CMS</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1040]/20 focus:border-[#0a1040]"
                    placeholder="admin@evanepal.org"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1040]/20 focus:border-[#0a1040]"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-xl border border-red-100">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#0a1040] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#0d1550] transition-colors disabled:opacity-50 mt-2 min-h-[44px]"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={15} />
                    Sign in
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-white/30 text-xs mt-6">
            EVA Nepal Admin Panel · Restricted access
          </p>
        </div>
      </div>
    </div>
  );
}
