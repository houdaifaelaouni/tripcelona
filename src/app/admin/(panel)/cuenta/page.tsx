import type { Metadata } from "next";
import { ChangePassword, MfaSetup } from "@/components/admin/account-security";
import { SettingsRow, SettingsTabs } from "@/components/admin/settings";
import { PageTitle, SectionHeader } from "@/components/admin/ui";
import { Avatar } from "@/components/uui/base/avatar/avatar";
import { requireStaff } from "@/lib/auth/staff";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function AccountPage() {
  const staff = await requireStaff();
  return (
    <>
      <PageTitle crumbs={[{ label: "Ajustes" }]}>Ajustes</PageTitle>
      <SettingsTabs current="/admin/cuenta" role={staff.role} />
      <SectionHeader title="Mi cuenta" description="Tu acceso al panel y su seguridad." />
      <SettingsRow label="Perfil">
        <div className="flex items-center gap-4">
          <Avatar size="lg" initials={staff.email.slice(0, 1).toUpperCase()} />
          <div>
            <p className="text-sm font-semibold text-primary">{staff.email}</p>
            <p className="text-sm text-tertiary">
              {staff.role === "owner" ? "Propietario" : "Editor"}
            </p>
          </div>
        </div>
      </SettingsRow>
      <SettingsRow label="Contraseña" description="Cámbiala cuando quieras.">
        <ChangePassword />
      </SettingsRow>
      <SettingsRow
        label="Verificación en dos pasos"
        description="Un código de tu app de autenticación además de la contraseña."
      >
        <MfaSetup />
      </SettingsRow>
    </>
  );
}
