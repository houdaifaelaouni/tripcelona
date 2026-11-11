import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signOut } from "@/lib/admin/auth-actions";

export const metadata: Metadata = { title: "Sin acceso" };

export default function NoAccessPage() {
  return (
    <Card className="p-6">
      <h1 className="text-display-sm">Tu cuenta no tiene acceso</h1>
      <p className="mt-2 text-meta text-muted">
        Has iniciado sesión, pero el propietario todavía no te ha dado un rol en el equipo.
      </p>
      <form action={signOut} className="mt-4">
        <Button type="submit" variant="secondary">
          Cerrar sesión
        </Button>
      </form>
    </Card>
  );
}
