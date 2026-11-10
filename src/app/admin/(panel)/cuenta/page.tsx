import type { Metadata } from "next";
import { ChangePassword, MfaSetup } from "@/components/admin/account-security";
import { PageTitle, Panel } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/staff";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function AccountPage() {
  const staff = await requireStaff();
  return (
    <>
      <PageTitle>Mi cuenta</PageTitle>
      <Panel>
        <p>
          <strong>{staff.email}</strong> · {staff.role === "owner" ? "Propietario" : "Editor"}
        </p>
      </Panel>
      <Panel title="Contraseña">
        <ChangePassword />
      </Panel>
      <Panel title="Verificación en dos pasos">
        <MfaSetup />
      </Panel>
    </>
  );
}
