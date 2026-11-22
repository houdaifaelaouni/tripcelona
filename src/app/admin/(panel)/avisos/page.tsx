import type { Metadata } from "next";
import { AlertRulesEditor } from "@/components/admin/alert-rules-editor";
import { Flash } from "@/components/admin/flash";
import { PageTitle } from "@/components/admin/ui";
import { saveAlertRules } from "@/lib/admin/alert-actions";
import { requireStaff } from "@/lib/auth/staff";
import { emailConfig, ownerEmail } from "@/lib/email/config";
import { loadAlertData, loadAlertRules } from "@/lib/ops/alert-data";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Avisos" };

/** Owner-only: when Tripcelona should tell the owner about departures, requests and checkouts. */
export default async function AlertsAdmin({ searchParams }: PageProps<"/admin/avisos">) {
  await requireStaff("owner");
  const { ok, error } = await searchParams;
  const db = createAdminClient();
  const [rules, data] = await Promise.all([loadAlertRules(db), loadAlertData(db)]);
  const [email, owner] = await Promise.all([emailConfig(), ownerEmail()]);
  const emailReady = Boolean(email && owner);
  return (
    <>
      <PageTitle
        description={
          <>
            Elige cuándo quieres enterarte de lo que pasa. Los avisos activos salen en el Panel, y
            los de email llegan a tu correo cada mañana a las 8.
            {!emailReady && " (Los emails aún no salen: falta configurar el envío de correo.)"}
          </>
        }
      >
        Avisos
      </PageTitle>
      <Flash ok={ok} error={error} />
      <AlertRulesEditor initial={rules} data={data} action={saveAlertRules} />
    </>
  );
}
