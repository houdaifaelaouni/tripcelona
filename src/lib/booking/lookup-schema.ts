import { z } from "zod";

/**
 * "Consulta tu reserva" (backlog #1): email + booking reference, no account.
 * People type references loosely ("tc 2026 0012", "TC20260012"), so they are
 * normalised to the stored form `TC-YYYY-NNNN`.
 */
export function normaliseReference(raw: string): string | null {
  const compact = raw
    .toUpperCase()
    .replace(/[\s_.]+/g, "")
    .replace(/–|—/g, "-");
  const m = /^TC-?(\d{4})-?(\d{4,6})$/.exec(compact);
  return m ? `TC-${m[1]}-${m[2]}` : null;
}

export const lookupSchema = z.object({
  website: z.string().max(0).optional().default(""),
  email: z.string().trim().toLowerCase().pipe(z.email("Email no válido.")),
  reference: z
    .string()
    .trim()
    .min(1, "Escribe la referencia de tu reserva.")
    .transform((v, ctx) => {
      const ref = normaliseReference(v);
      if (!ref) {
        ctx.addIssue({ code: "custom", message: "La referencia tiene la forma TC-2026-0001." });
        return z.NEVER;
      }
      return ref;
    }),
});

/** Same answer whether the reference does not exist or the email does not match. */
export const LOOKUP_NOT_FOUND =
  "No encontramos ninguna reserva con esa referencia y ese email. Revisa el email de confirmación o escríbenos por WhatsApp.";
