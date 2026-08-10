import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FreeShippingBar } from "@/components/FreeShippingBar";
import { LangHydrate } from "@/components/LangHydrate";
import { TikTokPixel } from "@/components/TikTokPixel";
import { settings } from "@/lib/settings";
import { readStoreSettings } from "@/lib/settings-db";
import { detectLangServer } from "@/lib/i18n";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const lang = await detectLangServer();
  const es = lang === "es";
  return {
    metadataBase: new URL("https://www.lumaei.com"),
    title: es ? `${settings.brandName} | Tienda Online` : `${settings.brandName} | Online Store`,
    description: es
      ? "Lumaei — tienda online de piezas seleccionadas. Envíos a México y Estados Unidos. Experiencia premium, fulfillment automatizado."
      : "Lumaei — online shop of hand-picked pieces. Shipping to Mexico and the United States. Premium experience, automated fulfillment.",
    openGraph: {
      title: es ? "Lumaei | Tienda Online" : "Lumaei | Online Store",
      description: es
        ? "Piezas seleccionadas con envíos a México y Estados Unidos."
        : "Hand-picked pieces shipped to Mexico and the United States.",
      url: "https://www.lumaei.com",
      siteName: "Lumaei",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
      type: "website",
      locale: es ? "es_MX" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: es ? "Lumaei | Tienda Online" : "Lumaei | Online Store",
      description: es
        ? "Piezas seleccionadas con envíos a México y Estados Unidos."
        : "Hand-picked pieces shipped to Mexico and the United States.",
      images: ["/og-image.png"],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await detectLangServer();
  const s = await readStoreSettings();
  return (
    <html
      lang={lang === "es" ? "es-MX" : "en-US"}
      className={`${cormorant.variable} ${dmSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta
          name="tiktok-developers-site-verification"
          content="9XsM8ZCc87GJXulDhdTcNL8JKUMFF6FN"
        />
      </head>
      <body className="min-h-full flex flex-col bg-cream text-brown">
        <TikTokPixel />
        <FreeShippingBar
          freeMx={s.freeShippingMxUsd}
          freeUs={s.freeShippingUsd}
        />
        <LangHydrate />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
