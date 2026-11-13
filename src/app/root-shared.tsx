import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { SkipLink } from "@/components/layout/skip-link";
import { ogLocales, type Locale } from "@/lib/i18n/config";
import { createT } from "@/lib/i18n/translate";
import { indexingAllowed } from "@/lib/seo/site-url";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono-face",
});

export function baseMetadata(locale: Locale): Metadata {
  const t = createT(locale);
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: {
      default: t("Tripcelona - Excursiones en grupo por Cataluña"),
      template: "%s | Tripcelona",
    },
    description: t(
      "Excursiones de un día cada domingo desde Estació del Nord, Barcelona: Pirineo, Garrotxa y pueblos medievales de Cataluña.",
    ),
    // Pre-launch and previews: noindex until NEXT_PUBLIC_ALLOW_INDEXING=true.
    robots: indexingAllowed() ? undefined : { index: false, follow: false },
    openGraph: { siteName: "Tripcelona", locale: ogLocales[locale], type: "website" },
  };
}

export const rootViewport: Viewport = {
  themeColor: "#ffffff",
};

/** The <html> document shared by the public site and the admin (two root layouts). */
export function RootDocument({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={locale} className={`${inter.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SkipLink locale={locale} />
        {children}
      </body>
    </html>
  );
}
