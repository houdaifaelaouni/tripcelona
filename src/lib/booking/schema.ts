import { z } from "zod";

export const MAX_TRAVELLERS = 20;

/**
 * Checkout input (FR-30). Shared by the form (error messages) and the server
 * action (authoritative validation). There is deliberately no price field:
 * the total is always recomputed on the server from the departure.
 */
export const checkoutSchema = z.object({
  departureId: z.uuid({ error: "La salida seleccionada no es válida." }),
  travellers: z.coerce
    .number({ error: "Indica el número de viajeros." })
    .int("Indica un número entero de viajeros.")
    .min(1, "Mínimo 1 viajero.")
    .max(MAX_TRAVELLERS, `Para más de ${MAX_TRAVELLERS} personas, pide un presupuesto de grupo.`),
  name: z.string().trim().min(2, "Escribe tu nombre y apellidos.").max(120),
  email: z.email({ error: "Escribe un email válido." }).trim().max(254),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{9,20}$/, "Escribe un teléfono válido, con prefijo si no es español."),
  pickupNote: z.string().trim().max(500, "Máximo 500 caracteres.").optional().default(""),
  terms: z.literal("on", { error: "Debes aceptar las condiciones de contratación." }),
  // Honeypot: real people never fill this hidden field.
  company: z.string().max(0).optional().default(""),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutField = keyof CheckoutInput;

export type CheckoutState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors: Partial<Record<CheckoutField, string>>;
      values: Partial<Record<CheckoutField, string>>;
    };

/** First error per field, for inline messages. */
export function fieldErrors(
  error: z.ZodError<CheckoutInput>,
): Partial<Record<CheckoutField, string>> {
  const out: Partial<Record<CheckoutField, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as CheckoutField | undefined;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

/** Cart checkout: the customer's data once, the lines as JSON (ids and counts only). */
export const MAX_CART_LINES = 6;
export const cartCheckoutSchema = checkoutSchema
  .omit({ departureId: true, travellers: true })
  .extend({
    items: z
      .string()
      .transform((v, ctx) => {
        try {
          return JSON.parse(v) as unknown;
        } catch {
          ctx.addIssue({ code: "custom", message: "El carrito no es válido." });
          return z.NEVER;
        }
      })
      .pipe(
        z
          .array(
            z.object({
              departureId: z.uuid(),
              travellers: z.number().int().min(1).max(MAX_TRAVELLERS),
            }),
          )
          .min(1, "Tu carrito está vacío.")
          .max(MAX_CART_LINES),
      ),
  });

export type CartCheckoutState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors: Partial<Record<CheckoutField, string>>;
      values: Partial<Record<CheckoutField, string>>;
    };
