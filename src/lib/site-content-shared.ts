/**
 * Texts and links the owner edits from the admin (home page, menu, footer).
 * Pure helpers shared by the public site and the admin forms: defaults,
 * parsing of the simple text formats the forms use, and the reverse.
 * Stored in the `settings` table; anything missing falls back to the defaults
 * below, which are the texts the site launched with.
 */
import { safeHref } from "@/lib/content/rich-text";
import { footerColumns, primaryNav, site } from "@/lib/site";

export type Pair = { title: string; body: string };
export type NavLink = { label: string; href: string; children?: NavLink[] };
export type FooterColumn = { title: string; links: { label: string; href: string }[] };

export type HomeContent = {
  heroTitle: string;
  heroLead: string;
  /** Optional background video for the home hero: https:// or /path to an .mp4/.webm. */
  heroVideoUrl: string;
  whyTitle: string;
  reasons: Pair[];
  stepsTitle: string;
  steps: Pair[];
  groupsTitle: string;
  groupPoints: string[];
  seoTitle: string;
  seoDescription: string;
};

export const HOME_DEFAULTS: HomeContent = {
  heroTitle: "Excursiones de un día desde Barcelona",
  heroLead:
    "El Pirineo, los volcanes de la Garrotxa y pueblos medievales de Cataluña. Tú eliges destino; nosotros ponemos el autocar, el guía y la logística.",
  heroVideoUrl: "",
  whyTitle: "Tú disfrutas del día, nosotros nos ocupamos del resto",
  reasons: [
    {
      title: "Sin coche ni aparcamiento",
      body: "Autocar de ida y vuelta desde el centro de Barcelona.",
    },
    { title: "Guía local", body: "Te acompaña durante toda la excursión y conoce cada rincón." },
    { title: "Salida céntrica", body: `Quedamos en ${site.meetingPoint}.` },
    {
      title: "Vuelves el mismo día",
      body: "Salidas en domingo, con regreso a Barcelona por la tarde.",
    },
    {
      title: "Reserva en dos minutos",
      body: "Pago seguro con tarjeta y confirmación por email al momento.",
    },
    {
      title: "También para grupos",
      body: "Empresas, colegios o amigos: preparamos un tour a medida.",
    },
  ],
  stepsTitle: "Reservar es muy fácil",
  steps: [
    { title: "Elige tu excursión", body: "Mira las próximas salidas y elige fecha." },
    { title: "Reserva online", body: "Indica cuántas personas sois y paga con tarjeta." },
    { title: "Recibe la confirmación", body: "Te llega por email con todos los detalles." },
    { title: "¡A disfrutar!", body: "Te esperamos en el punto de salida el día de la excursión." },
  ],
  groupsTitle: "¿Organizas una salida en grupo?",
  groupPoints: [
    "Fecha y destino a vuestra medida",
    "Autocar y guía para todo el grupo",
    "Presupuesto sin compromiso",
  ],
  seoTitle: "Excursiones desde Barcelona | Tripcelona",
  seoDescription:
    "Excursiones en grupo cada domingo desde Estació del Nord: Pirineo, Garrotxa, Osona y Alquézar.",
};

/** A video link the hero can play: https or a site path, ending in .mp4 or .webm (blank = none). */
export function parseVideoUrl(raw: string): Parsed<string> {
  const v = raw.trim();
  if (!v) return { ok: true, value: "" };
  if (!/^(https:\/\/|\/(?!\/))[^\s]+\.(mp4|webm)(\?[^\s]*)?$/i.test(v))
    return fail("Vídeo de portada: pon un enlace https:// o una ruta / que acabe en .mp4 o .webm.");
  return { ok: true, value: v };
}

export const HOME_LIMITS = { reasons: [2, 8], steps: [3, 6], groupPoints: [1, 6] } as const;

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
const lines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

// "Title | text" lines ----------------------------------------------------------

export function parsePairs(
  text: string,
  what: string,
  [min, max]: readonly [number, number],
): Parsed<Pair[]> {
  const out: Pair[] = [];
  for (const line of lines(text)) {
    const [title, ...rest] = line.split("|");
    const body = rest.join("|").trim();
    if (!title.trim() || !body)
      return fail(`${what}: cada línea debe ser «Título | texto». Revisa: «${line.slice(0, 40)}».`);
    if (title.trim().length > 80 || body.length > 240)
      return fail(`${what}: «${title.trim().slice(0, 30)}» es demasiado largo.`);
    out.push({ title: title.trim(), body });
  }
  if (out.length < min || out.length > max)
    return fail(`${what}: pon entre ${min} y ${max} líneas (ahora ${out.length}).`);
  return { ok: true, value: out };
}

export const pairsToText = (pairs: Pair[]) => pairs.map((p) => `${p.title} | ${p.body}`).join("\n");

export function parseList(
  text: string,
  what: string,
  [min, max]: readonly [number, number],
): Parsed<string[]> {
  const out = lines(text);
  if (out.some((l) => l.length > 160)) return fail(`${what}: hay una línea demasiado larga.`);
  if (out.length < min || out.length > max)
    return fail(`${what}: pon entre ${min} y ${max} líneas (ahora ${out.length}).`);
  return { ok: true, value: out };
}

/** Merge stored JSON over the defaults, keeping only well-formed values. */
export function homeFromValue(raw: unknown): HomeContent {
  const v = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (k: keyof HomeContent) =>
    typeof v[k] === "string" && (v[k] as string).trim() ? (v[k] as string).trim() : null;
  const pairs = (k: "reasons" | "steps") => {
    const a = v[k];
    if (!Array.isArray(a)) return null;
    const ok = a.filter(
      (p): p is Pair =>
        !!p && typeof p.title === "string" && typeof p.body === "string" && !!p.title && !!p.body,
    );
    return ok.length >= HOME_LIMITS[k][0] ? ok : null;
  };
  const points = Array.isArray(v.groupPoints)
    ? v.groupPoints.filter((p): p is string => typeof p === "string" && !!p.trim())
    : [];
  return {
    heroTitle: str("heroTitle") ?? HOME_DEFAULTS.heroTitle,
    heroLead: str("heroLead") ?? HOME_DEFAULTS.heroLead,
    heroVideoUrl: (() => {
      const r = parseVideoUrl(typeof v.heroVideoUrl === "string" ? v.heroVideoUrl : "");
      return r.ok ? r.value : "";
    })(),
    whyTitle: str("whyTitle") ?? HOME_DEFAULTS.whyTitle,
    reasons: pairs("reasons") ?? HOME_DEFAULTS.reasons,
    stepsTitle: str("stepsTitle") ?? HOME_DEFAULTS.stepsTitle,
    steps: pairs("steps") ?? HOME_DEFAULTS.steps,
    groupsTitle: str("groupsTitle") ?? HOME_DEFAULTS.groupsTitle,
    groupPoints: points.length ? points : HOME_DEFAULTS.groupPoints,
    seoTitle: str("seoTitle") ?? HOME_DEFAULTS.seoTitle,
    seoDescription: str("seoDescription") ?? HOME_DEFAULTS.seoDescription,
  };
}

// Menu: "Label | /link" lines, "- " in front of a submenu entry ------------------

function parseLink(line: string, what: string): Parsed<{ label: string; href: string }> {
  const [label, ...rest] = line.split("|");
  const href = safeHref(rest.join("|").trim());
  if (!label.trim() || !href)
    return fail(
      `${what}: cada línea debe ser «Texto | enlace» (con / o https://). Revisa: «${line.slice(0, 40)}».`,
    );
  if (label.trim().length > 60)
    return fail(`${what}: «${label.trim().slice(0, 30)}» es demasiado largo.`);
  return { ok: true, value: { label: label.trim(), href } };
}

export function parseNav(text: string): Parsed<NavLink[]> {
  const items: NavLink[] = [];
  for (const line of lines(text)) {
    const sub = line.startsWith("-");
    const r = parseLink(sub ? line.replace(/^-\s*/, "") : line, "Menú");
    if (!r.ok) return r;
    if (sub) {
      const parent = items.at(-1);
      if (!parent) return fail("Menú: un enlace con «-» debe ir debajo de otro enlace.");
      (parent.children ??= []).push(r.value);
    } else items.push(r.value);
  }
  if (items.length < 2 || items.length > 8)
    return fail("Menú: pon entre 2 y 8 enlaces principales.");
  if (items.some((i) => (i.children?.length ?? 0) > 8))
    return fail("Menú: máximo 8 enlaces por submenú.");
  return { ok: true, value: items };
}

export const navToText = (nav: NavLink[]) =>
  nav
    .flatMap((i) => [
      `${i.label} | ${i.href}`,
      ...(i.children ?? []).map((c) => `- ${c.label} | ${c.href}`),
    ])
    .join("\n");

// Footer: "# Column title" then "Label | /link" lines ----------------------------

export function parseFooter(text: string): Parsed<FooterColumn[]> {
  const cols: FooterColumn[] = [];
  for (const line of lines(text)) {
    if (line.startsWith("#")) {
      const title = line.replace(/^#+\s*/, "").trim();
      if (!title || title.length > 40)
        return fail("Pie: el título de cada columna es obligatorio (máximo 40 caracteres).");
      cols.push({ title, links: [] });
      continue;
    }
    const col = cols.at(-1);
    if (!col) return fail("Pie: empieza cada columna con una línea «# Título».");
    const r = parseLink(line, "Pie");
    if (!r.ok) return r;
    col.links.push(r.value);
  }
  if (cols.length < 1 || cols.length > 6) return fail("Pie: pon entre 1 y 6 columnas.");
  if (cols.some((c) => c.links.length < 1 || c.links.length > 10))
    return fail("Pie: cada columna necesita entre 1 y 10 enlaces.");
  return { ok: true, value: cols };
}

export const footerToText = (cols: FooterColumn[]) =>
  cols
    .map((c) => [`# ${c.title}`, ...c.links.map((l) => `${l.label} | ${l.href}`)].join("\n"))
    .join("\n\n");

export function navFromValue(raw: unknown): NavLink[] {
  if (!Array.isArray(raw)) return primaryNav;
  const ok = raw.filter(
    (i): i is NavLink => !!i && typeof i.label === "string" && safeHref(i.href) !== null,
  );
  return ok.length >= 2 ? ok : primaryNav;
}

export function footerFromValue(raw: unknown): FooterColumn[] {
  if (!Array.isArray(raw)) return footerColumns;
  const ok = raw.filter(
    (c): c is FooterColumn =>
      !!c && typeof c.title === "string" && Array.isArray(c.links) && c.links.length > 0,
  );
  return ok.length ? ok : footerColumns;
}
