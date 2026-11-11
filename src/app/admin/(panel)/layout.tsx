import type { Metadata } from "next";
import { ChevronUp, ExternalLink, LogOut } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { signOut } from "@/lib/admin/auth-actions";
import { requireStaff } from "@/lib/auth/staff";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin Tripcelona" },
  robots: { index: false, follow: false },
};

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <Suspense fallback={<PageSkeleton />}>
        <Shell>{children}</Shell>
      </Suspense>
    </div>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  return (
    <>
      <aside className="bg-navy px-4 py-4 text-white md:sticky md:top-0 md:flex md:h-dvh md:w-64 md:shrink-0 md:flex-col md:py-6">
        <Link href="/admin" className="block px-1 text-base font-semibold md:px-3">
          Tripcelona · Admin
        </Link>
        <div className="mt-4 md:flex-1 md:overflow-y-auto">
          <AdminNav role={staff.role} />
        </div>
        <details className="group relative mt-4 border-t border-white/15 pt-4">
          <summary className="flex cursor-pointer list-none items-center gap-3 rounded-control px-1 py-1 hover:bg-white/10 md:px-3 [&::-webkit-details-marker]:hidden">
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-meta font-semibold text-navy uppercase"
            >
              {staff.email.slice(0, 1)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-meta" title={staff.email}>
                {staff.email}
              </span>
              <span className="block text-caption text-white/70">
                {staff.role === "owner" ? "Propietario" : "Editor"}
              </span>
            </span>
            <ChevronUp
              aria-hidden
              size={16}
              className="shrink-0 rotate-180 transition-transform group-open:rotate-0"
            />
          </summary>
          <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-card bg-white p-2 text-ink shadow-float md:top-auto md:bottom-full md:mt-0 md:mb-2">
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
        </details>
      </aside>
      <main
        id="contenido"
        tabIndex={-1}
        className="min-w-0 flex-1 bg-surface-alt px-4 py-6 outline-none md:px-10 md:py-10"
      >
        <div className="mx-auto max-w-[1120px]">{children}</div>
      </main>
    </>
  );
}
