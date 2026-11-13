"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { useT } from "@/components/i18n/provider";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  useEffect(() => {
    // Error monitoring hooks in here (Sentry, optional per PRD §9).
    console.error(error);
  }, [error]);

  return (
    <section className="container-site py-16 md:py-24" role="alert">
      <h1 className="text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]">
        {t("Algo ha fallado")}
      </h1>
      <p className="mt-3 max-w-xl text-tertiary">
        {t(
          "Ha ocurrido un error inesperado. Inténtalo de nuevo o escríbenos por WhatsApp si persiste.",
        )}
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={reset}>{t("Reintentar")}</Button>
        <ButtonLink href="/" variant="outline">
          {t("Volver al inicio")}
        </ButtonLink>
      </div>
    </section>
  );
}
