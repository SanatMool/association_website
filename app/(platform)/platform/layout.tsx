import type { Metadata } from "next";
import PlatformShell from "@/components/platform/PlatformShell";

// Platform panel is Nibjar's own operator tool, not tenant-branded — override the root
// layout's per-association title/description entirely, don't just add the manifest, or this
// falls back to the root layout's hardcoded EVA Nepal default (no Association row has a domain
// matching assoc-platform.nibjar.com, so generateMetadata() there always misses).
export const metadata: Metadata = {
  // `absolute` (not `default`) is required here — `default` still gets wrapped by the ROOT
  // layout's own title.template (e.g. "%s | <association name>"), since Next.js only skips
  // ancestor templates for `absolute`. Confirmed via curl: `default` produced
  // "Nibjar Platform | Namo Udyam" instead of just "Nibjar Platform".
  title: { absolute: "Nibjar Platform", template: "%s | Nibjar Platform" },
  description: "Nibjar association platform — operator panel.",
  manifest: "/api/manifest/platform",
};

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>;
}
