"use server";

import { randomBytes } from "node:crypto";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/auth/audit";
import { assertStaff } from "@/lib/auth/staff";
import { CONTENT_TAG } from "@/lib/content/queries";
import { readingMinutes, sanitizeDoc } from "@/lib/content/rich-text";
import { createClient } from "@/lib/supabase/server";
import { backWith } from "./redirect";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .optional()
    .transform((v) => (v ? v : null));

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "URL: solo minúsculas, números y guiones (sin espacios ni acentos).",
  )
  .max(120);

const base = {
  title: z.string().trim().min(3, "El título es obligatorio.").max(200),
  slug,
  content: z.string().max(2_000_000, "Contenido demasiado largo."),
  seo_title: optionalText(70),
  seo_description: optionalText(170),
  status: z.enum(["draft", "published", "archived"]),
};

const postSchema = z.object({
  ...base,
  excerpt: optionalText(400),
  cover_id: z
    .string()
    .optional()
    .transform((v) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : null)),
  tags: z
    .string()
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12),
    ),
});

const pageSchema = z.object({ ...base, kind: z.enum(["page", "legal"]).optional() });

const STATUS_OK = { published: "publicado", draft: "borrador", archived: "archivado" } as const;

function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Revisa el formulario.";
}

function dbError(message: string) {
  return message.includes("duplicate key")
    ? "Ya existe otra con esa URL."
    : `No se pudo guardar: ${message}`;
}

/** Reserved first segments: these paths belong to their own routes. */
const RESERVED = new Set([
  "admin",
  "api",
  "blog",
  "excursiones",
  "ofertas-de-viajes",
  "reservar",
  "contactanos",
  "crea-tu-tour",
  "preguntas-frecuentes",
  "eventos",
  "health",
]);

export async function createPost() {
  const staff = await assertStaff("any");
  const db = await createClient();
  const { data, error } = await db
    .from("posts")
    .insert({
      title: "Nueva entrada",
      slug: `borrador-${randomBytes(3).toString("hex")}`,
      status: "draft",
    })
    .select("id")
    .single();
  if (error) backWith("/admin/blog", { error: dbError(error.message) });
  await audit(staff.id, "post.create", "posts", data.id);
  redirect(`/admin/blog/${data.id}`);
}

export async function savePost(id: string, form: FormData) {
  const staff = await assertStaff("any");
  const back = `/admin/blog/${id}`;
  const parsed = postSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) backWith(back, { error: firstError(parsed.error) });
  const { content: raw, ...fields } = parsed.data;
  const content = sanitizeDoc(raw);

  const db = await createClient();
  const { data: current } = await db.from("posts").select("published_at").eq("id", id).single();
  const { error } = await db
    .from("posts")
    .update({
      ...fields,
      content: content as never,
      reading_minutes: readingMinutes(content),
      published_at:
        fields.status === "published"
          ? (current?.published_at ?? new Date().toISOString())
          : current?.published_at,
    })
    .eq("id", id);
  if (error) backWith(back, { error: dbError(error.message) });

  await audit(staff.id, "post.update", "posts", id, { status: fields.status, slug: fields.slug });
  updateTag(CONTENT_TAG);
  backWith(back, { ok: STATUS_OK[fields.status] });
}

export async function deletePost(id: string) {
  const staff = await assertStaff("owner");
  const db = await createClient();
  const { error } = await db.from("posts").delete().eq("id", id);
  if (error) backWith(`/admin/blog/${id}`, { error: dbError(error.message) });
  await audit(staff.id, "post.delete", "posts", id);
  updateTag(CONTENT_TAG);
  backWith("/admin/blog", { ok: "eliminado" });
}

export async function createPage() {
  const staff = await assertStaff("any");
  const db = await createClient();
  const { data, error } = await db
    .from("pages")
    .insert({
      title: "Nueva página",
      slug: `borrador-${randomBytes(3).toString("hex")}`,
      status: "draft",
    })
    .select("id")
    .single();
  if (error) backWith("/admin/paginas", { error: dbError(error.message) });
  await audit(staff.id, "page.create", "pages", data.id);
  redirect(`/admin/paginas/${data.id}`);
}

/** Legal pages can only be changed by the owner (US-32). */
export async function savePage(id: string, form: FormData) {
  const staff = await assertStaff("any");
  const back = `/admin/paginas/${id}`;
  const db = await createClient();
  const { data: current } = await db
    .from("pages")
    .select("kind, published_at")
    .eq("id", id)
    .single();
  if (!current) backWith("/admin/paginas", { error: "Página no encontrada." });
  if (current.kind === "legal" && staff.role !== "owner") {
    backWith(back, { error: "Solo el propietario puede cambiar las páginas legales." });
  }

  const parsed = pageSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) backWith(back, { error: firstError(parsed.error) });
  const { content: raw, kind: requestedKind, ...fields } = parsed.data;
  const kind = staff.role === "owner" && requestedKind ? requestedKind : current.kind;
  if (RESERVED.has(fields.slug))
    backWith(back, { error: "Esa URL la usa otra sección de la web." });

  const { error } = await db
    .from("pages")
    .update({
      ...fields,
      kind,
      content: sanitizeDoc(raw) as never,
      published_at:
        fields.status === "published"
          ? (current.published_at ?? new Date().toISOString())
          : current.published_at,
    })
    .eq("id", id);
  if (error) backWith(back, { error: dbError(error.message) });

  await audit(staff.id, "page.update", "pages", id, {
    status: fields.status,
    slug: fields.slug,
    kind,
  });
  updateTag(CONTENT_TAG);
  backWith(back, { ok: STATUS_OK[fields.status] });
}

// FAQs ------------------------------------------------------------------------

const faqSchema = z.object({
  question: z.string().trim().min(5, "Escribe la pregunta.").max(300),
  answer: z.string().trim().min(2, "Escribe la respuesta.").max(4000),
  category: optionalText(80),
  sort_order: z.coerce.number().int().min(0).max(100000),
  status: z.enum(["draft", "published", "archived"]),
});

export async function saveFaq(id: string | null, form: FormData) {
  const staff = await assertStaff("any");
  const parsed = faqSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) backWith("/admin/faqs", { error: firstError(parsed.error) });
  const db = await createClient();
  const { data, error } = id
    ? await db.from("faqs").update(parsed.data).eq("id", id).select("id").single()
    : await db.from("faqs").insert(parsed.data).select("id").single();
  if (error) backWith("/admin/faqs", { error: dbError(error.message) });
  await audit(staff.id, id ? "faq.update" : "faq.create", "faqs", data.id);
  updateTag(CONTENT_TAG);
  backWith("/admin/faqs", { ok: "guardado" });
}

export async function deleteFaq(id: string) {
  const staff = await assertStaff("any");
  const db = await createClient();
  const { error } = await db.from("faqs").delete().eq("id", id);
  if (error) backWith("/admin/faqs", { error: dbError(error.message) });
  await audit(staff.id, "faq.delete", "faqs", id);
  updateTag(CONTENT_TAG);
  backWith("/admin/faqs", { ok: "eliminado" });
}

// Reviews (opiniones) -----------------------------------------------------------

const reviewSchema = z.object({
  author: z.string().trim().min(2, "Escribe el nombre de quien opina.").max(120),
  source: z
    .string()
    .trim()
    .min(2, "Indica de dónde viene la opinión (grupo, centro, Google...).")
    .max(160),
  text: z.string().trim().min(10, "Escribe la opinión.").max(3000),
  rating: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .pipe(z.number().int().min(1).max(5).nullable()),
  status: z.enum(["pending", "approved", "hidden"]),
});

export async function saveReview(id: string | null, form: FormData) {
  const staff = await assertStaff("any");
  const parsed = reviewSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) backWith("/admin/opiniones", { error: firstError(parsed.error) });
  const db = await createClient();
  const { data, error } = id
    ? await db.from("reviews").update(parsed.data).eq("id", id).select("id").single()
    : await db.from("reviews").insert(parsed.data).select("id").single();
  if (error) backWith("/admin/opiniones", { error: dbError(error.message) });
  await audit(staff.id, id ? "review.update" : "review.create", "reviews", data.id);
  updateTag(CONTENT_TAG);
  backWith("/admin/opiniones", { ok: "guardado" });
}

export async function deleteReview(id: string) {
  const staff = await assertStaff("any");
  const db = await createClient();
  const { error } = await db.from("reviews").delete().eq("id", id);
  if (error) backWith("/admin/opiniones", { error: dbError(error.message) });
  await audit(staff.id, "review.delete", "reviews", id);
  updateTag(CONTENT_TAG);
  backWith("/admin/opiniones", { ok: "eliminado" });
}
