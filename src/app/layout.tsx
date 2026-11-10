import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tripcelona",
  description: "Excursiones en grupo por Cataluña desde Barcelona.",
  robots: { index: false, follow: false }, // pre-launch: never index previews
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
