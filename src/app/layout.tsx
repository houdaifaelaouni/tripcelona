import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SkipLink } from "@/components/layout/skip-link";
import { indexingAllowed } from "@/lib/seo/site-url";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Tripcelona - Excursiones en grupo por Cataluña",
    template: "%s | Tripcelona",
  },
  description:
    "Excursiones de un día cada domingo desde Estació del Nord, Barcelona: Pirineo, Garrotxa y pueblos medievales de Cataluña.",
  // Pre-launch and previews: noindex until NEXT_PUBLIC_ALLOW_INDEXING=true.
  robots: indexingAllowed() ? undefined : { index: false, follow: false },
  openGraph: { siteName: "Tripcelona", locale: "es_ES", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#003580",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SkipLink />
        <Header />
        <main id="contenido" tabIndex={-1} className="flex flex-1 flex-col outline-none">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
