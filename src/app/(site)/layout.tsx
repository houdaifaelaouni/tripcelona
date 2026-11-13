import { Suspense } from "react";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SiteMotion } from "@/components/motion/site-motion";
import { SiteBanner } from "@/components/layout/site-banner";

/** Public site chrome. The admin has its own layout under /admin. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={null}>
        <SiteMotion />
      </Suspense>
      <SiteBanner />
      <Header />
      <main id="contenido" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        {children}
      </main>
      <Footer />
    </>
  );
}
