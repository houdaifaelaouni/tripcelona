"use client";

import { useState } from "react";
import { Button } from "@/components/admin/button";
import { Input, Select } from "@/components/admin/fields";

const PRESETS = {
  meta: { source: "facebook", medium: "paid_social" },
  instagram: { source: "instagram", medium: "paid_social" },
  tiktok: { source: "tiktok", medium: "paid_social" },
  google: { source: "google", medium: "cpc" },
  email: { source: "newsletter", medium: "email" },
  otro: { source: "", medium: "" },
} as const;

/** Ready-made "URL parameters" strings with each platform's dynamic macros. */
export const DYNAMIC_PARAMS: { label: string; value: string }[] = [
  {
    label: "Meta Ads (Parámetros de URL del anuncio)",
    value:
      "utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}",
  },
  {
    label: "TikTok Ads (URL del anuncio, parámetros)",
    value:
      "utm_source=tiktok&utm_medium=paid_social&utm_campaign=__CAMPAIGN_NAME__&utm_content=__CID_NAME__&utm_term=__AID_NAME__",
  },
  {
    label: "Google Ads (Plantilla de seguimiento: sufijo de URL final)",
    value:
      "utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}",
  },
];

const slug = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        });
      }}
    >
      {done ? "Copiado" : "Copiar"}
    </Button>
  );
}

/** Builds a tagged link for one ad, plus the macro strings for each platform. */
export function UtmBuilder({ pages }: { pages: { label: string; url: string }[] }) {
  const [base, setBase] = useState(pages[0]?.url ?? "");
  const [preset, setPreset] = useState<keyof typeof PRESETS>("meta");
  const [source, setSource] = useState<string>(PRESETS.meta.source);
  const [medium, setMedium] = useState<string>(PRESETS.meta.medium);
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");

  let url = "";
  try {
    const u = new URL(base);
    if (source) u.searchParams.set("utm_source", slug(source));
    if (medium) u.searchParams.set("utm_medium", slug(medium));
    if (campaign) u.searchParams.set("utm_campaign", slug(campaign));
    if (content) u.searchParams.set("utm_content", slug(content));
    url = u.toString();
  } catch {
    url = "";
  }

  return (
    <div className="space-y-5 px-4 pb-5 md:px-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Select label="Página de destino" value={base} onChange={(e) => setBase(e.target.value)}>
          {pages.map((p) => (
            <option key={p.url} value={p.url}>
              {p.label}
            </option>
          ))}
        </Select>
        <Select
          label="Plataforma"
          value={preset}
          onChange={(e) => {
            const k = e.target.value as keyof typeof PRESETS;
            setPreset(k);
            setSource(PRESETS[k].source);
            setMedium(PRESETS[k].medium);
          }}
        >
          <option value="meta">Facebook (Meta)</option>
          <option value="instagram">Instagram (Meta)</option>
          <option value="tiktok">TikTok</option>
          <option value="google">Google Ads</option>
          <option value="email">Email / newsletter</option>
          <option value="otro">Otra</option>
        </Select>
        <Input label="utm_source" value={source} onChange={(e) => setSource(e.target.value)} />
        <Input label="utm_medium" value={medium} onChange={(e) => setMedium(e.target.value)} />
        <Input
          label="Campaña (utm_campaign)"
          placeholder="navidad-andorra-2026"
          value={campaign}
          onChange={(e) => setCampaign(e.target.value)}
        />
        <Input
          label="Anuncio (utm_content)"
          placeholder="video-mercado-1"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-3 rounded-lg bg-secondary p-3">
        <code className="min-w-0 flex-1 text-xs break-all text-primary">
          {url || "Elige una página"}
        </code>
        {url && <Copy text={url} />}
      </div>
      <div>
        <p className="text-sm font-semibold text-primary">
          Parámetros dinámicos para pegar en cada plataforma
        </p>
        <p className="text-sm text-tertiary">
          Así cada anuncio se etiqueta solo con el nombre de su campaña y anuncio.
        </p>
        <ul className="mt-3 space-y-3">
          {DYNAMIC_PARAMS.map((d) => (
            <li key={d.label} className="rounded-lg ring-1 ring-secondary">
              <p className="px-3 pt-2 text-xs font-medium text-tertiary">{d.label}</p>
              <div className="flex items-center gap-3 p-3 pt-1">
                <code className="min-w-0 flex-1 text-xs break-all text-primary">{d.value}</code>
                <Copy text={d.value} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
