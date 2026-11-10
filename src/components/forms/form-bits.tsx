import Link from "next/link";

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
    <div>
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          name="privacy"
          required
          className="mt-1 h-4 w-4 accent-blue"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "privacy-error" : undefined}
        />
        <span>
          He leído y acepto la{" "}
          <Link href="/politica-de-privacidad" target="_blank" className="text-blue underline">
            política de privacidad
          </Link>
          .
        </span>
      </label>
      {error && (
        <p id="privacy-error" className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-control border border-danger bg-danger/5 p-3 font-bold text-danger"
    >
      {message}
    </div>
  );
}

export function FormSuccess({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div role="status" className="rounded-panel border border-success bg-success/5 p-6">
      <h2 className="text-xl text-success">{title}</h2>
      <div className="mt-2">{children}</div>
    </div>
  );
}
