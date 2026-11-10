import type { Metadata } from "next";
import { Suspense } from "react";
import { MfaChallenge } from "@/components/admin/mfa-challenge";
import { safeAdminNext } from "@/lib/admin/safe-next";

export const metadata: Metadata = { title: "Verificación" };

export default function VerifyPage({ searchParams }: PageProps<"/admin/verificar">) {
  return (
    <Suspense>
      <Verify searchParams={searchParams} />
    </Suspense>
  );
}

async function Verify({
  searchParams,
}: {
  searchParams: PageProps<"/admin/verificar">["searchParams"];
}) {
  const { next } = await searchParams;
  return <MfaChallenge next={safeAdminNext(next)} />;
}
