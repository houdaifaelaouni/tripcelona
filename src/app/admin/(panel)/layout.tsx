import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-nav";
import { LoadingScreen } from "@/components/admin/loading";
import { SIDEBAR_COOKIE } from "@/components/ui/sidebar-cookie";
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

/** shadcn "sidebar-07" style frame: collapsible sidebar + top bar + content column. */
async function Shell({ children }: { children: React.ReactNode }) {
  const [staff, jar] = await Promise.all([requireStaff(), cookies()]);
  return (
    <AdminShell
      staff={{ role: staff.role, email: staff.email, name: staff.name ?? null }}
      defaultOpen={jar.get(SIDEBAR_COOKIE)?.value !== "false"}
    >
      <main id="contenido" tabIndex={-1} className="px-4 pt-6 pb-12 outline-none md:px-8 md:pt-8">
        <div className="mx-auto max-w-[1180px]">{children}</div>
      </main>
    </AdminShell>
  );
}
