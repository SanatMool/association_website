import type { Metadata } from "next";
import PlatformShell from "@/components/platform/PlatformShell";

export const metadata: Metadata = { manifest: "/api/manifest/platform" };

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>;
}
