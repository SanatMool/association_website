import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { LocaleProvider } from "@/context/LocaleContext";
import PublicChrome from "@/components/layout/PublicChrome";
import FooterWrapper from "@/components/layout/FooterWrapper";
import NavbarWrapper from "@/components/layout/NavbarWrapper";
import { getAssociation } from "@/lib/getAssociation";
import { getSettings } from "@/lib/settings";
import { DEFAULT_THEME_PRESET, getThemePreset, hexToRgbTriple } from "@/lib/theme-presets";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-dm-serif",
  weight: "400",
  display: "swap",
});

export async function generateViewport(): Promise<Viewport> {
  const association = await getAssociation();
  return {
    themeColor: association?.themeColor ?? "#0a1040",
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const association = await getAssociation();
  const name = association?.name ?? "Association Platform";
  const domain = association?.domain ?? "eva.nibjar.com";
  const logo = association?.logo ?? "/default-logo.png";
  const settings = association?.id ? await getSettings(association.id) : {};
  const isPersonMode = settings.member_mode === "person";
  const description =
    association?.description ??
    (isPersonMode
      ? `${name} is a professional association representing individual members and industry experts.`
      : `${name} is an association of event venues and infrastructure providers.`);
  const favicon = settings.favicon_image || logo;
  const titleSuffix = isPersonMode ? "Professional Association" : "Venue Association";

  return {
    metadataBase: new URL(`https://${domain}`),
    manifest: "/api/manifest",
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
    title: {
      default: `${name} | Kathmandu's Premier ${titleSuffix}`,
      template: `%s | ${name}`,
    },
    description,
    authors: [{ name }],
    creator: name,
    publisher: name,
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `https://${domain}`,
      siteName: name,
      title: name,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: name,
    },
    other: {
      // Next.js's `appleWebApp.capable` only emits the legacy Apple-specific meta tag —
      // the standard replacement (supported by Chrome/Android too) has no dedicated
      // metadata field, so it's added manually here alongside it.
      "mobile-web-app-capable": "yes",
    },
    formatDetection: {
      telephone: false,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: `https://${domain}`,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolves to null on hostnames with no matching Association (e.g. the platform panel's own
  // domain) — resolveTranslations()/LocaleProvider default to "venue" in that case, which is
  // harmless since useLocale() text isn't consumed anywhere under /admin, /portal, /platform.
  const association = await getAssociation();
  const settings = association?.id ? await getSettings(association.id) : {};
  const memberMode = settings.member_mode === "person" ? "person" : "venue";

  // Per-association color preset: applied as an inline style on <html> rather than a <style>
  // tag, so it always wins the CSS cascade regardless of where Next.js injects the linked
  // globals.css stylesheet (an inline style attribute's specificity can't be out-cascaded by
  // any stylesheet rule). Omitted entirely for the default preset — zero output change.
  const presetKey = association?.colorPreset ?? DEFAULT_THEME_PRESET;
  const themeStyle: CSSProperties | undefined =
    presetKey === DEFAULT_THEME_PRESET
      ? undefined
      : (() => {
          const preset = getThemePreset(presetKey);
          const vars: Record<string, string> = {};
          for (const [shade, hex] of Object.entries(preset.primary)) vars[`--navy-${shade}`] = hexToRgbTriple(hex);
          for (const [shade, hex] of Object.entries(preset.accent)) vars[`--gold-${shade}`] = hexToRgbTriple(hex);
          return vars as CSSProperties;
        })();

  return (
    <html lang="en" className={`${inter.variable} ${dmSerifDisplay.variable}`} style={themeStyle}>
      <body className="font-sans">
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`,
          }}
        />
        <LocaleProvider memberMode={memberMode}>
          <PublicChrome navbar={<NavbarWrapper />} footer={<FooterWrapper />}>
            {children}
          </PublicChrome>
        </LocaleProvider>
      </body>
    </html>
  );
}
