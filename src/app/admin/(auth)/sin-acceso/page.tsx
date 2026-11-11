import type { Metadata } from "next";
import { Button } from "@/components/admin/button";
import { signOut } from "@/lib/admin/auth-actions";

export const metadata: Metadata = { title: "Sin acceso" };

export default function NoAccessPage() {
  return (
    <div>
      <h1 className="text-2xl leading-8 font-semibold text-primary md:text-3xl md:leading-9">
        Tu cuenta no tiene acceso
      </h1>
      <p className="mt-3 text-md text-tertiary">
        Has iniciado sesión, pero el propietario todavía no te ha dado un rol en el equipo.
      </p>
      <form action={signOut} className="mt-4">
        <Button type="submit" variant="secondary">
          Cerrar sesión
        </Button>
      </form>
    </div>
  );
}
