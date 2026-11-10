"use server";

import { randomUUID } from "node:crypto";
import {
  contactAutoReply,
  contactOwnerAlert,
  quoteAutoReply,
  quoteOwnerAlert,
} from "@/lib/email/form-templates";
import { sendEmail } from "@/lib/email/send";
import type { EmailContent } from "@/lib/email/templates";
import { siteUrl } from "@/lib/seo/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { allowSubmission } from "./rate-limit";
import {
  QUOTE_CUSTOM,
  contactSchema,
  fieldErrors,
  formObject,
  quoteSchema,
  type FormState,
} from "./schema";

const tooMany = (values: Record<string, string | string[]>): FormState => ({
  status: "error",
  message:
    "Has enviado varios formularios seguidos. Espera unos minutos o escríbenos por WhatsApp.",
  fieldErrors: {},
  values,
});
const SAVE_FAILED =
  "No hemos podido guardar tu mensaje. Inténtalo de nuevo o escríbenos por WhatsApp.";

/** Sends both emails; failures are recorded on the row, never shown as a failed submission. */
async function notify(
  table: "leads" | "tour_requests",
  id: string,
  emails: { to: string | undefined; content: EmailContent; replyTo?: string; key: string }[],
) {
  const errors: string[] = [];
  for (const e of emails) {
    if (!e.to) {
      errors.push(`${e.key}: no recipient (OWNER_EMAIL)`);
      continue;
    }
    try {
      await sendEmail({
        to: e.to,
        ...e.content,
        replyTo: e.replyTo,
        idempotencyKey: `${table}-${id}-${e.key}`,
      });
    } catch (err) {
      errors.push(`${e.key}: ${(err as Error).message}`);
    }
  }
  const { error } = await createAdminClient()
    .from(table)
    .update(
      errors.length
        ? { email_error: errors.join(" | ").slice(0, 1000) }
        : { notified_at: new Date().toISOString() },
    )
    .eq("id", id);
  if (error) console.error(`[forms] ${table} ${id} notify status`, error.message);
  if (errors.length) console.error(`[forms] ${table} ${id} email`, errors);
}

/** FR-72: contact form. Stored first, then emailed. */
export async function submitContact(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formObject(form);
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return { status: "ok" }; // bot: silent
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      fieldErrors: fieldErrors(parsed.error),
      values,
    };
  }
  if (!(await allowSubmission("contact"))) return tooMany(values);
  const c = parsed.data;

  const id = randomUUID();
  const { error } = await createAdminClient()
    .from("leads")
    .insert({
      id,
      source: "contact",
      payload: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        message: c.message,
        newsletter: c.newsletter,
        privacy_accepted_at: new Date().toISOString(),
      },
    });
  if (error) {
    console.error("[forms] contact insert", error.message);
    return { status: "error", message: SAVE_FAILED, fieldErrors: {}, values };
  }

  await notify("leads", id, [
    { key: "owner", to: process.env.OWNER_EMAIL, content: contactOwnerAlert(c), replyTo: c.email },
    {
      key: "autoreply",
      to: c.email,
      content: contactAutoReply(c),
      replyTo: process.env.OWNER_EMAIL,
    },
  ]);
  return { status: "ok" };
}

/** FR-40/41: quote request ("Crea tu tour"). Stored first, then emailed. */
export async function submitQuote(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formObject(form, ["extras"]);
  const parsed = quoteSchema.safeParse(values);
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return { status: "ok" };
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      fieldErrors: fieldErrors(parsed.error),
      values,
    };
  }
  if (!(await allowSubmission("quote"))) return tooMany(values);
  const q = parsed.data;
  const db = createAdminClient();

  let tourId: string | null = null;
  let tourLabel = "Destino a medida";
  if (q.tour !== QUOTE_CUSTOM) {
    const { data: tour } = await db
      .from("tours")
      .select("id, title")
      .eq("slug", q.tour)
      .eq("status", "published")
      .maybeSingle();
    if (!tour) {
      return {
        status: "error",
        message: "Revisa los campos marcados.",
        fieldErrors: { tour: "Elige una excursión de la lista." },
        values,
      };
    }
    tourId = tour.id;
    tourLabel = tour.title;
  }

  const id = randomUUID();
  const { error } = await db.from("tour_requests").insert({
    id,
    name: q.name,
    email: q.email,
    phone: q.phone,
    group_size: q.groupSize,
    preferred_dates: q.dates,
    tour_id: tourId,
    budget: q.budget,
    message: q.message,
    company: q.company,
    extras: q.extras,
    privacy_accepted_at: new Date().toISOString(),
  });
  if (error) {
    console.error("[forms] quote insert", error.message);
    return { status: "error", message: SAVE_FAILED, fieldErrors: {}, values };
  }

  await notify("tour_requests", id, [
    {
      key: "owner",
      to: process.env.OWNER_EMAIL,
      content: quoteOwnerAlert(q, tourLabel, `${siteUrl()}/admin/solicitudes/${id}`),
      replyTo: q.email,
    },
    {
      key: "autoreply",
      to: q.email,
      content: quoteAutoReply(q, tourLabel),
      replyTo: process.env.OWNER_EMAIL,
    },
  ]);
  return { status: "ok" };
}
