import type { Metadata } from "next";
import { ChevronDown, ExternalLink, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AdminNav, MobileNav, SectionTitle, SidebarBrand } from "@/components/admin/admin-nav";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { signOut } from "@/lib/admin/auth-actions";
import { requireStaff } from "@/lib/auth/staff";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin Tripcelona" },
  robots: { index: false, follow: false },
};

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-full flex-1 bg-surface-alt">
      <Suspense fallback={<PageSkeleton />}>
        <Shell>{children}</Shell>
      </Suspense>
    </div>
  );
}

/**
 * Application layout after Preline UI's sidebar dashboard
 * (https://github.com/htmlstreamofficial/preline, MIT + Preline UI Fair Use
 * License): fixed sidebar from lg up, sticky top bar, content on a grey canvas.
 */
async function Shell({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const role = staff.role === "owner" ? "Propietario" : "Editor";
  return (
    <>
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 flex-col border-e border-border bg-white lg:flex">
        <div className="flex h-16 shrink-0 items-center px-5">
          <SidebarBrand />
        </div>
        <div className="flex-1 overflow-y-auto pt-2">
          <AdminNav role={staff.role} />
        </div>
      </aside>
      <div className="lg:ps-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-white px-4 md:px-6 lg:px-8">
          <MobileNav role={staff.role} />
          <div className="min-w-0 flex-1">
            <SectionTitle />
          </div>
          <Link
            href="/"
            className="hidden h-10 items-center gap-2 rounded-control border border-border px-3 text-meta font-semibold hover:bg-surface-alt sm:inline-flex"
          >
            <ExternalLink aria-hidden size={16} />
            Ver web
          </Link>
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full p-1 pe-2 hover:bg-surface-alt [&::-webkit-details-marker]:hidden">
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy text-meta font-semibold text-white uppercase"
              >
                {staff.email.slice(0, 1)}
              </span>
              <span className="sr-only">Cuenta: {staff.email}</span>
              <ChevronDown
                aria-hidden
                size={16}
                className="text-muted transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="absolute end-0 top-full z-40 mt-2 w-64 rounded-card border border-border bg-white p-2 shadow-float">
              <div className="border-b border-border px-3 pt-1 pb-3">
                <p className="truncate text-meta font-semibold" title={staff.email}>
                  {staff.email}
                </p>
                <p className="text-caption text-muted">{role}</p>
              </div>
              <div className="pt-2">
                <Link
                  href="/admin/cuenta"
                  className="flex h-10 items-center gap-2 rounded-control px-3 text-meta hover:bg-surface-alt"
                >
                  <UserRound aria-hidden size={16} />
                  Mi cuenta
                </Link>
                <Link
                  href="/"
                  className="flex h-10 items-center gap-2 rounded-control px-3 text-meta hover:bg-surface-alt"
                >
                  <ExternalLink aria-hidden size={16} />
                  Ver web
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex h-10 w-full items-center gap-2 rounded-control px-3 text-meta hover:bg-surface-alt"
                  >
                    <LogOut aria-hidden size={16} />
                    Salir
                  </button>
                </form>
              </div>
            </div>
          </details>
        </header>
        <main
          id="contenido"
          tabIndex={-1}
          className="px-4 py-6 outline-none md:px-6 md:py-8 lg:px-8"
        >
          <div className="mx-auto max-w-[1180px]">{children}</div>
        </main>
      </div>
    </>
  );
}
