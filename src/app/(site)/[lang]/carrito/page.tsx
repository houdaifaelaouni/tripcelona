import type { Metadata } from "next";
import { createT } from "@/lib/i18n/translate";
import { isLocale } from "@/lib/i18n/config";
import { CartView } from "@/components/cart/cart-view";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/carrito">): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: isLocale(lang) ? createT(lang)("Carrito") : "Carrito",
    robots: { index: false, follow: false },
  };
}

export default async function CartPage({ params }: PageProps<"/[lang]/carrito">) {
  const { lang } = await params;
  const t = createT(isLocale(lang) ? lang : "es");
  return (
    <div className="container-detail py-8 md:py-12">
      <h1 className="mb-8 text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]">
        {t("Tu carrito")}
      </h1>
      <CartView />
    </div>
  );
}
