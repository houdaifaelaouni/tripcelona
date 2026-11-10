import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { safeAdminNext } from "@/lib/admin/safe-next";

export const metadata: Metadata = { title: "Iniciar sesión" };

const NOTICES: Record<string, string> = {
  enlace: "El enlace no es válido o ha caducado. Pide uno nuevo.",
};

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <Suspense>
      <Login searchParams={searchParams} />
    </Suspense>
  );
}

async function Login({
  searchParams,
}: {
  searchParams: PageProps<"/admin/login">["searchParams"];
}) {
  const params = await searchParams;
  const aviso = typeof params.aviso === "string" ? NOTICES[params.aviso] : undefined;
  return <LoginForm next={safeAdminNext(params.next)} notice={aviso} />;
}
