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

export const viewport: Viewport = {
  themeColor: "#0a1040",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export async function generateMetadata(): Promise<Metadata> {
  const association = await getAssociation();
  const name = association?.name ?? "EVA Nepal – Event and Venue Association Nepal";
  const domain = association?.domain ?? "eva.nibjar.com";
  const description =
    association?.description ??
    "EVA Nepal is the official association of event venues, banquet halls and wedding venues in Kathmandu. Representing 150+ member venues across the Kathmandu Valley since 2011.";
  const logo = association?.logo ?? "/default-logo.png";
  const settings = association?.id ? await getSettings(association.id) : {};
  const favicon = settings.favicon_image || logo;

  return {
    metadataBase: new URL(`https://${domain}`),
    manifest: "/api/manifest",
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
    title: {
      default: `${name} | Kathmandu's Premier Venue Association`,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerifDisplay.variable}`}>
      <body className="font-sans">
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`,
          }}
        />
        <LocaleProvider>
          <PublicChrome navbar={<NavbarWrapper />} footer={<FooterWrapper />}>
            {children}
          </PublicChrome>
        </LocaleProvider>
      </body>
    </html>
  );
}
