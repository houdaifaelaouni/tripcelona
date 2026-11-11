import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin Tripcelona" },
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: LayoutProps<"/admin">) {
  return (
    <main
      id="contenido"
      className="flex flex-1 items-center justify-center bg-surface-alt px-4 py-12"
    >
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-display-lg font-semibold text-navy">
          Tripcelona · Admin
        </p>
        {children}
      </div>
    </main>
  );
}
