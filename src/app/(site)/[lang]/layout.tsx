import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LocaleProvider } from "@/components/i18n/provider";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SiteBanner } from "@/components/layout/site-banner";
import { SiteMotion } from "@/components/motion/site-motion";
import { isLocale, locales } from "@/lib/i18n/config";
import { baseMetadata, RootDocument, rootViewport } from "../../root-shared";

export const viewport = rootViewport;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return baseMetadata(lang);
}

/** Public site chrome. The admin has its own layout under /admin. */
export default async function SiteLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <RootDocument locale={lang}>
      <LocaleProvider locale={lang}>
        <Suspense fallback={null}>
          <SiteMotion />
        </Suspense>
        <SiteBanner />
        <Header locale={lang} />
        <main id="contenido" tabIndex={-1} className="flex flex-1 flex-col outline-none">
          {children}
        </main>
        <Footer locale={lang} />
      </LocaleProvider>
    </RootDocument>
  );
}
