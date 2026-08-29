"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Lock, Mail } from "lucide-react";
import Image from "next/image";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl]       = useState<string | null>(null);
  const [assocName, setAssocName]   = useState<string>("EVA Nepal");
  const [description, setDescription] = useState<string>("The official industry body for event venues in Kathmandu Valley.");
  const [memberCount, setMemberCount] = useState<string>("150+");
  const [yearsActive, setYearsActive] = useState<string>("13+");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) setError("Invalid email or password. Please try again.");
  }, []);

  useEffect(() => {
    fetch("/api/admin/branding")
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) return;
        const d = res.data;
        setAssocName(d.name);
        if (d.logo) setLogoUrl(d.logo);
        if (d.description) setDescription(d.description);
        if (d.memberCount) setMemberCount(`${d.memberCount}+`);
        if (d.yearsActive) setYearsActive(`${d.yearsActive}+`);
      })
      .catch(() => {});
  }, []);

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
      window.location.href = "/admin/dashboard";
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-mesh-navy">

      {/* ── Noise + scan-line overlays ── */}
      <div className="texture-noise scan-line absolute inset-0 pointer-events-none z-0" />

      {/* ── Animated bokeh orbs ── */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 600, height: 600,
          top: "-15%", left: "-10%",
          background: "radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 65%)",
          animation: "bokehFloat 12s ease-in-out infinite",
        }}
      />
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 500, height: 500,
          bottom: "-12%", right: "-8%",
          background: "radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 65%)",
          animation: "bokehFloat 16s ease-in-out infinite reverse",
          animationDelay: "3s",
        }}
      />
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 350, height: 350,
          top: "45%", left: "45%",
          background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 65%)",
          animation: "bokehFloat 10s ease-in-out infinite",
          animationDelay: "6s",
        }}
      />

      {/* ── Page layout ── */}
      <div className="relative z-10 min-h-screen flex">

        {/* ════════════════════════════════════════
            LEFT PANEL — branding
        ════════════════════════════════════════ */}
        <div className="hidden lg:flex flex-col justify-between w-[460px] flex-shrink-0 border-r border-white/[0.07] p-12 relative overflow-hidden">

          {/* Subtle left-panel inner glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(160deg, rgba(245,158,11,0.04) 0%, transparent 60%)" }} />

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex justify-center"
          >
            <Image
              src={logoUrl ?? "/default-logo.png"}
              alt={assocName}
              width={280}
              height={180}
              className="h-28 w-auto"
              priority
            />
          </motion.div>

          {/* Headline + body */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10"
          >
            <div className="gold-divider mb-7" />
            <h2 className="text-4xl font-bold text-white leading-[1.15] tracking-tight mb-5">
              <span className="text-gradient-gold">{assocName}</span>
            </h2>
            <p className="text-white/40 text-sm leading-relaxed mb-10 max-w-[280px]">
              {description}
            </p>

            {/* Stat cards */}
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid grid-cols-3 gap-3"
            >
              {[
                { value: memberCount, label: "Members" },
                { value: yearsActive, label: "Years" },
                { value: "KTM",       label: "Based in" },
              ].map(({ value, label }) => (
                <motion.div
                  key={label}
                  variants={fadeUp}
                  className="card-glass p-4 text-center"
                >
                  <div className="text-xl font-bold text-amber-400 mb-0.5 animate-pulse-gold">{value}</div>
                  <div className="text-[10px] text-white/30 uppercase tracking-widest">{label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Nibjar credit */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="relative z-10"
          >
            <a
              href="https://www.nibjar.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 group"
            >
              <span className="text-white/30 text-xs group-hover:text-white/50 transition-colors">Powered by Nibjar Solutions</span>
              <Image
                src="/nibjar/nibjar_white_logo.png"
                alt="Nibjar Solutions"
                width={100}
                height={34}
                className="h-7 w-auto opacity-40 group-hover:opacity-70 transition-opacity"
              />
            </a>
          </motion.div>
        </div>

        {/* ════════════════════════════════════════
            RIGHT PANEL — login form
        ════════════════════════════════════════ */}
        <div className="flex-1 flex items-center justify-center p-6">

          {/* Radial spotlight behind card */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 60% 55% at 65% 50%, rgba(245,158,11,0.07) 0%, transparent 70%)" }} />

          <motion.div
            initial={{ opacity: 0, y: 36, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[400px] relative z-10"
          >
            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <Image
                src={logoUrl ?? "/default-logo.png"}
                alt={assocName}
                width={180}
                height={116}
                className="h-16 w-auto"
                priority
              />
            </div>

            {/* Animated gold gradient border wrapper */}
            <div className="animated-gradient-border rounded-3xl p-[1.5px] gold-glow-pulse">
              <div className="rounded-3xl overflow-hidden" style={{ background: "rgba(8,12,45,0.88)", backdropFilter: "blur(24px)" }}>

                {/* Card top bar with logo hint */}
                <div className="px-8 pt-7 pb-5 border-b border-white/[0.07] flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-tight mb-0.5">Welcome back</h1>
                    <p className="text-xs text-white/35">Sign in to the {assocName} admin panel</p>
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-4"
                    style={{
                      background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.06))",
                      border: "1px solid rgba(245,158,11,0.3)",
                    }}
                  >
                    <Lock size={15} className="text-amber-400" />
                  </div>
                </div>

                {/* Form */}
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  className="px-8 py-7"
                >
                  <form onSubmit={handleSubmit} className="space-y-5">

                    <motion.div variants={fadeUp}>
                      <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-[0.18em] mb-2">
                        Email address
                      </label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="admin@example.com"
                          className="w-full pl-10 pr-3 py-3 rounded-xl text-sm text-white placeholder-white/20 transition-all focus:outline-none"
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                          onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(245,158,11,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.08)"; }}
                          onBlur={(e)  => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                        />
                      </div>
                    </motion.div>

                    <motion.div variants={fadeUp}>
                      <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-[0.18em] mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-white placeholder-white/20 transition-all focus:outline-none"
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                          onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(245,158,11,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.08)"; }}
                          onBlur={(e)  => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/70 transition-colors"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </motion.div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2.5 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl"
                      >
                        <span className="text-red-400 flex-shrink-0 font-bold">✕</span>
                        {error}
                      </motion.div>
                    )}

                    <motion.div variants={fadeUp}>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 min-h-[48px]"
                        style={{
                          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                          color: "#060b2c",
                          boxShadow: "0 0 24px rgba(245,158,11,0.25), 0 4px 16px rgba(0,0,0,0.3)",
                        }}
                      >
                        {loading ? (
                          <span className="inline-block w-4 h-4 border-2 border-[#060b2c]/30 border-t-[#060b2c] rounded-full animate-spin" />
                        ) : (
                          <>
                            <LogIn size={15} />
                            Sign in
                          </>
                        )}
                      </button>
                    </motion.div>

                  </form>
                </motion.div>

                {/* Card footer */}
                <div className="px-8 pb-6 border-t border-white/[0.06] pt-4 flex items-center justify-between">
                  <span className="text-[11px] text-white/20">Restricted access</span>
                  <a
                    href="https://www.nibjar.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 group"
                  >
                    <span className="text-[11px] text-white/20 group-hover:text-white/40 transition-colors">by</span>
                    <Image
                      src="/nibjar/nibjar_white_logo.png"
                      alt="Nibjar Solutions"
                      width={72}
                      height={24}
                      className="h-5 w-auto opacity-30 group-hover:opacity-60 transition-opacity"
                    />
                  </a>
                </div>

              </div>
            </div>

            <p className="text-center text-white/15 text-xs mt-5">
              © {new Date().getFullYear()} EVA Nepal · Admin Panel
            </p>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
