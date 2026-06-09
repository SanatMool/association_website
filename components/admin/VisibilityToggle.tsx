"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VisibilityToggle({
  memberId,
  visible,
}: {
  memberId: string;
  visible: boolean;
}) {
  const [isVisible, setIsVisible] = useState(visible);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function toggle() {
    const next = !isVisible;
    setIsVisible(next);
    await fetch(`/api/members/${memberId}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: next }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      title={isVisible ? "Click to hide" : "Click to show"}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
        isVisible
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
          : "bg-gray-100 text-gray-400 border border-gray-200 hover:bg-gray-200"
      }`}
    >
      {isVisible ? <Eye size={11} /> : <EyeOff size={11} />}
      {isVisible ? "Visible" : "Hidden"}
    </button>
  );
}
