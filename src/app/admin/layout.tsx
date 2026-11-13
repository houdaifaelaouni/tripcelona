import type { Metadata } from "next";
import { baseMetadata, RootDocument, rootViewport } from "../root-shared";

export const metadata: Metadata = baseMetadata("es");
export const viewport = rootViewport;

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <RootDocument locale="es">{children}</RootDocument>;
}
