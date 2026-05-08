import type { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/context/LocaleContext";
import PublicChrome from "@/components/layout/PublicChrome";
import FooterWrapper from "@/components/layout/FooterWrapper";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://eva.nibjar.com"),
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  title: {
    default:
      "EVA Nepal – Event and Venue Association Nepal | Kathmandu's Premier Venue Association",
    template: "%s | EVA Nepal",
  },
  description:
    "EVA Nepal is the official association of event venues, banquet halls and wedding venues in Kathmandu. Representing 150+ member venues across the Kathmandu Valley since 2011.",
  keywords: [
    "event venues in Kathmandu",
    "wedding venues Kathmandu",
    "party venues Kathmandu",
    "banquet halls Kathmandu",
    "venue association Nepal",
    "event management Nepal",
    "EVA Nepal",
    "event and venue association Nepal",
    "Kathmandu event venues",
    "Nepal wedding venues",
  ],
  authors: [{ name: "EVA Nepal" }],
  creator: "Event and Venue Association Nepal",
  publisher: "EVA Nepal",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://evanepal.org",
    siteName: "EVA Nepal",
    title: "EVA Nepal – Event and Venue Association Nepal",
    description:
      "The official association of event venues and banquet halls in Kathmandu, Nepal. Established 2011.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "EVA Nepal – Event and Venue Association Nepal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EVA Nepal – Event and Venue Association Nepal",
    description:
      "The official association of event venues in Kathmandu. 150+ member venues.",
    images: ["/og-image.jpg"],
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
    canonical: "https://evanepal.org",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerifDisplay.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Event and Venue Association Nepal",
              alternateName: "EVA Nepal",
              url: "https://evanepal.org",
              logo: "https://evanepal.org/evanepal.png",
              description:
                "The official association of event venues, banquet halls and wedding venues in Kathmandu, Nepal.",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Maitidevi",
                addressLocality: "Kathmandu",
                addressRegion: "Bagmati",
                addressCountry: "NP",
              },
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+977-1-XXXXXXX",
                contactType: "customer service",
                email: "info@evanepal.org",
              },
              foundingDate: "2011",
              sameAs: [
                "https://facebook.com/evanepal",
                "https://instagram.com/evanepal",
              ],
            }),
          }}
        />
      </head>
      <body className="font-sans">
        <LocaleProvider>
          <PublicChrome footer={<FooterWrapper />}>{children}</PublicChrome>
        </LocaleProvider>
      </body>
    </html>
  );
}
