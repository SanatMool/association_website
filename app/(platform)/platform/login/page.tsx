"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Eye, EyeOff } from "lucide-react";

export default function PlatformLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/platform-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/platform/dashboard");
    } else {
      const data = await res.json();
      setError(data.error ?? "Login failed");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 mb-4">
            <Layers size={26} className="text-indigo-300" />
          </div>
          <h1 className="text-2xl font-bold text-white">nibjar Platform</h1>
          <p className="text-indigo-300/70 text-sm mt-1">Association management portal</p>
        </div>

        {/* Card */}
        <div className="bg-white/8 backdrop-blur-sm border border-white/12 rounded-2xl p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-indigo-200/70 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="admin@nibjar.com"
                className="w-full px-3 py-2.5 bg-white/10 border border-white/15 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-indigo-200/70 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 bg-white/10 border border-white/15 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-3 py-2 bg-red-500/15 border border-red-500/25 rounded-xl text-red-300 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all mt-2"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
