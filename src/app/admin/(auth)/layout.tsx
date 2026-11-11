import type { Metadata } from "next";
import { Suspense } from "react";
import { SidebarBrand } from "@/components/admin/admin-nav";
import { LoginCarousel, type Slide } from "@/components/admin/login-carousel";
import { getPublishedTours } from "@/lib/tours/queries";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin Tripcelona" },
  robots: { index: false, follow: false },
};

/**
 * Split sign-in layout (after the Untitled UI "log in, split with carousel"
 * page pattern, built from scratch): form on the left, our tour photos on
 * the right from lg up.
 */
export default function AuthLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="grid min-h-dvh flex-1 bg-primary lg:grid-cols-2">
      <div className="flex flex-col px-4 py-8 md:px-8">
        <SidebarBrand />
        <main id="contenido" className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-90">{children}</div>
        </main>
        <p className="text-sm text-tertiary">© Tripcelona · Panel de gestión</p>
      </div>
      <div className="relative hidden overflow-hidden lg:block">
        <Suspense fallback={<div className="h-full bg-brand-section" />}>
          <Photos />
        </Suspense>
      </div>
    </div>
  );
}

async function Photos() {
  const tours = await getPublishedTours().catch(() => []);
  const slides: Slide[] = tours
    .filter((t) => t.image)
    .slice(0, 5)
    .map((t) => ({ url: t.image!.url, alt: t.image!.alt, title: t.title, area: t.area }));
  return <LoginCarousel slides={slides} />;
}
