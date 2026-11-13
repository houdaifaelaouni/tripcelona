"use client";

import { Button } from "./button";

/** Opens the browser print dialog; the admin chrome hides itself in print. */
export function PrintButton({ children = "Imprimir" }: { children?: React.ReactNode }) {
  return (
    <Button type="button" variant="secondary" onClick={() => window.print()}>
      {children}
    </Button>
  );
}
