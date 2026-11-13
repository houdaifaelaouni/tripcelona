import { CircleAlert, CircleCheck } from "lucide-react";
import Link from "@/components/i18n/link";
import { Checkbox } from "@/components/ui/field";

/** Honeypot (FR-41): off-screen, hidden from assistive tech, never autofilled. */
export function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Web
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

export function PrivacyConsent({ error }: { error?: string }) {
  return (
    <Checkbox
      id="privacy"
      name="privacy"
      required
      error={error}
      label={
        <>
          He leído y acepto la{" "}
          <Link
            href="/politica-de-privacidad"
            target="_blank"
            className="font-semibold underline underline-offset-2"
          >
            política de privacidad
          </Link>
          .
        </>
      }
    />
  );
}

export function FormAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4 text-error-primary"
    >
      <CircleAlert aria-hidden size={20} className="mt-0.5 shrink-0" />
      <p className="font-semibold">{message}</p>
    </div>
  );
}

export function FormSuccess({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div role="status" className="rounded-2xl border border-secondary bg-white p-6 shadow-lg">
      <span className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
        <CircleCheck aria-hidden size={24} />
      </span>
      <h2 className="mt-4 text-display-sm">{title}</h2>
      <div className="mt-2 text-tertiary">{children}</div>
    </div>
  );
}
