"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Error monitoring hooks in here (Sentry, optional per PRD §9).
    console.error(error);
  }, [error]);

  return (
    <section className="container-site py-16 md:py-24" role="alert">
      <h1 className="text-3xl leading-[1.2] font-semibold tracking-tight text-primary md:text-4xl">
        Algo ha fallado
      </h1>
      <p className="mt-3 max-w-xl text-tertiary">
        Ha ocurrido un error inesperado. Inténtalo de nuevo o escríbenos por WhatsApp si persiste.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={reset}>Reintentar</Button>
        <ButtonLink href="/" variant="outline">
          Volver al inicio
        </ButtonLink>
      </div>
    </section>
  );
}
