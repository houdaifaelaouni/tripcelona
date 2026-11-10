import type { Metadata } from "next";
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
      <aside className="bg-navy px-4 py-4 text-white md:w-56 md:shrink-0 md:py-6">
        <Link href="/admin" className="text-lg font-bold">
          Tripcelona · Admin
        </Link>
        <div className="mt-4">
          <AdminNav role={staff.role} />
        </div>
        <div className="mt-6 border-t border-white/20 pt-4 text-sm">
          <p className="truncate text-white/80" title={staff.email}>
            {staff.email}
          </p>
          <p className="text-white/60">{staff.role === "owner" ? "Propietario" : "Editor"}</p>
          <div className="mt-3 flex gap-3">
            <Link href="/" className="underline">
              Ver web
            </Link>
            <form action={signOut}>
              <button type="submit" className="underline">
                Salir
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main
        id="contenido"
        tabIndex={-1}
        className="min-w-0 flex-1 bg-surface-alt px-4 py-6 outline-none md:px-8"
      >
        {children}
      </main>
    </>
  );
}
