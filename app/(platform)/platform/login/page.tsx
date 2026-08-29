"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Eye, EyeOff, LogIn, Mail, Lock } from "lucide-react";
import AuthCard, { AuthFieldWrap, AuthInput, AuthSubmitButton } from "@/components/ui/panel/AuthCard";

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
    <AuthCard
      accent="indigo"
      brandIcon={Layers}
      brandName="nibjar Platform"
      description="Manage every association on the platform from one place."
      statTiles={[]}
      panelTitle="Welcome back"
      panelSubtitle="Sign in to the nibjar platform"
      headerIcon={Layers}
      error={error}
      footerLabel="Internal tool — nibjar team only"
      copyrightLabel={`© ${new Date().getFullYear()} nibjar Solutions · Platform Admin`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthFieldWrap>
          <AuthInput
            label="Email"
            icon={Mail}
            accent="indigo"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            placeholder="admin@nibjar.com"
          />
        </AuthFieldWrap>
        <AuthFieldWrap>
          <AuthInput
            label="Password"
            icon={Lock}
            accent="indigo"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            rightSlot={
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-white/25 hover:text-white/70 transition-colors">
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            }
          />
        </AuthFieldWrap>
        <AuthFieldWrap>
          <AuthSubmitButton loading={loading} accent="indigo" icon={LogIn} label="Sign in" />
        </AuthFieldWrap>
      </form>
    </AuthCard>
  );
}
