import { z } from "zod";

/**
 * Public form schemas (FR-40, FR-41, FR-72). Spanish messages; the honeypot
 * (`website`) must stay empty and gets the same generic answer as any error.
 */
const honeypot = z.string().max(0).optional().default("");
const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .optional()
    .transform((v) => (v ? v : null));
// Preprocess: zod skips refinements on a missing optional value.
const consent = z.preprocess(
  (v) => v ?? "",
  z.string().refine((v) => v === "on" || v === "true", "Debes aceptar la política de privacidad."),
);

export const contactSchema = z.object({
  website: honeypot,
  name: z.string().trim().min(2, "Escribe tu nombre.").max(120),
  email: z.string().trim().toLowerCase().pipe(z.email("Email no válido.")),
  phone: optional(40),
  message: z.string().trim().min(10, "Cuéntanos un poco más (mínimo 10 caracteres).").max(4000),
  newsletter: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  privacy: consent,
});
export type ContactInput = z.infer<typeof contactSchema>;

export const QUOTE_CUSTOM = "a-medida";

export const quoteSchema = z.object({
  website: honeypot,
  tour: z.string().trim().min(1, "Elige una excursión o «destino a medida»."),
  dates: z.string().trim().min(1, "Indica una fecha o un periodo.").max(200),
  groupSize: z.coerce
    .number({ error: "Número de personas no válido." })
    .int("Número entero.")
    .min(1, "Mínimo 1 persona.")
    .max(1000, "Para más de 1000 personas, escríbenos."),
  extras: z.array(z.string().max(200)).max(20).default([]),
  budget: optional(200),
  name: z.string().trim().min(2, "Escribe tu nombre.").max(120),
  email: z.string().trim().toLowerCase().pipe(z.email("Email no válido.")),
  phone: z.string().trim().min(6, "Teléfono o WhatsApp para contactarte.").max(40),
  company: optional(160),
  message: optional(4000),
  privacy: consent,
});
export type QuoteInput = z.infer<typeof quoteSchema>;

export type FormState =
  | { status: "idle" }
  | { status: "ok"; reference?: string }
  | {
      status: "error";
      message: string;
      fieldErrors: Record<string, string>;
      values: Record<string, string | string[]>;
    };

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Form data -> plain object; repeated keys (checkbox groups) become arrays. */
export function formObject(
  form: FormData,
  arrays: string[] = [],
): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of form.entries()) {
    if (typeof v !== "string" || k.startsWith("$")) continue;
    if (arrays.includes(k)) out[k] = [...((out[k] as string[]) ?? []), v];
    else out[k] = v;
  }
  for (const k of arrays) out[k] ??= [];
  return out;
}
