import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

/** Public site chrome. The admin has its own layout under /admin. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        {children}
      </main>
      <Footer />
    </>
  );
}
