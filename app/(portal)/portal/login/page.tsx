"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, User, Mail, Lock } from "lucide-react";
import AuthCard, { AuthFieldWrap, AuthInput, AuthSubmitButton } from "@/components/ui/panel/AuthCard";

export default function PortalLoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,    setError]    = useState<string>("");
  const [loading,  setLoading]  = useState(false);
  const [logoUrl, setLogoUrl]       = useState<string | null>(null);
  const [assocName, setAssocName]   = useState<string>("EVA Nepal");
  const [description, setDescription] = useState<string>("Sign in to view your membership, meetings, events, and dues.");
  const [memberCount, setMemberCount] = useState<string>("150+");
  const [yearsActive, setYearsActive] = useState<string>("13+");

  useEffect(() => {
    fetch("/api/admin/branding")
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) return;
        const d = res.data;
        setAssocName(d.name);
        if (d.logo) setLogoUrl(d.logo);
        if (d.memberCount) setMemberCount(`${d.memberCount}+`);
        if (d.yearsActive) setYearsActive(`${d.yearsActive}+`);
        setDescription(`Sign in to your ${d.name} member account.`);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/portal-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!json.ok) throw new Error(json.error ?? "Invalid credentials");
      router.push("/portal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally { setLoading(false); }
  }

  return (
    <AuthCard
      accent="gold"
      logoUrl={logoUrl ?? "/default-logo.png"}
      brandName={assocName}
      description={description}
      statTiles={[
        { value: memberCount, label: "Members" },
        { value: yearsActive, label: "Years" },
        { value: "KTM", label: "Based in" },
      ]}
      panelTitle="Member Portal"
      panelSubtitle={`Sign in to your ${assocName} account`}
      headerIcon={User}
      error={error}
      footerLabel="Contact your admin for access"
      copyrightLabel={`© ${new Date().getFullYear()} ${assocName} · Member Portal`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthFieldWrap>
          <AuthInput
            label="Email"
            icon={Mail}
            accent="gold"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            placeholder="your@email.com"
          />
        </AuthFieldWrap>
        <AuthFieldWrap>
          <AuthInput
            label="Password"
            icon={Lock}
            accent="gold"
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
          <AuthSubmitButton loading={loading} accent="gold" icon={LogIn} label="Sign In" />
        </AuthFieldWrap>
      </form>
    </AuthCard>
  );
}
