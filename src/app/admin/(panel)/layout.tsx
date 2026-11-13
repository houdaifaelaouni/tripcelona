import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminRouter, AdminSidebar } from "@/components/admin/admin-nav";
import { LoadingScreen } from "@/components/admin/loading";
import { requireStaff } from "@/lib/auth/staff";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin Tripcelona" },
  robots: { index: false, follow: false },
};

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-full flex-1 bg-primary">
      <Suspense fallback={<LoadingScreen />}>
        <Shell>{children}</Shell>
      </Suspense>
    </div>
  );
}

/** Untitled UI application layout: sidebar navigation + content column. */
async function Shell({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  return (
    <AdminRouter>
      <AdminSidebar staff={{ role: staff.role, email: staff.email, name: staff.name ?? null }} />
      <div className="lg:pl-[248px]">
        <main id="contenido" tabIndex={-1} className="px-4 pt-6 pb-12 outline-none md:px-8 md:pt-8">
          <div className="mx-auto max-w-[1180px]">{children}</div>
        </main>
      </div>
    </AdminRouter>
  );
}
