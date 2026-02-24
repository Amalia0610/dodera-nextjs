import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { PrismicPreviewBar } from "@/components/PrismicPreviewBar";
import { SITE, DEFAULT_META } from "@/config/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

/* ── Global metadata ────────────────────────────────────── */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: DEFAULT_META.title,
    template: `%s | ${SITE.name}`,
  },
  description: DEFAULT_META.description,
  keywords: [...DEFAULT_META.keywords],
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    title: DEFAULT_META.title,
    description: DEFAULT_META.description,
    images: [{ url: SITE.ogImage, width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    site: SITE.social.twitter,
    creator: SITE.social.twitter,
    title: DEFAULT_META.title,
    description: DEFAULT_META.description,
    images: [SITE.ogImage],
  },
  icons: {
    icon: SITE.favicon,
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: SITE.url,
  },
  category: "technology",
  classification: "Software Development, AI Development",
  other: {
    "google-site-verification": "",   // fill when available
  },
};

export const viewport: Viewport = {
  themeColor: SITE.themeColor,
  width: "device-width",
  initialScale: 1,
};

/* ── Root Layout ────────────────────────────────────────── */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <TooltipProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "hsl(var(--card))",
                color: "hsl(var(--card-foreground))",
                border: "1px solid hsl(var(--border))",
              },
            }}
          />
        </TooltipProvider>
        <PrismicPreviewBar />
      </body>
    </html>
  );
}
