import type { Metadata } from "next";
import { baseMetadata, RootDocument, rootViewport } from "../root-shared";

export const metadata: Metadata = {
  ...baseMetadata("es"),
  title: "Embarque",
  robots: { index: false, follow: false },
};
export const viewport = rootViewport;

/** Driver pages: no site header or footer, just the scanner. */
export default function DriverRootLayout({ children }: LayoutProps<"/conductor">) {
  return <RootDocument locale="es">{children}</RootDocument>;
}
