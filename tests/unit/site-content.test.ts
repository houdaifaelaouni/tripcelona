import { describe, expect, it } from "vitest";
import {
  HOME_DEFAULTS,
  footerFromValue,
  footerToText,
  homeFromValue,
  navFromValue,
  navToText,
  pairsToText,
  parseFooter,
  parseNav,
  parsePairs,
} from "@/lib/site-content-shared";
import { footerColumns, primaryNav } from "@/lib/site";

describe("menu text", () => {
  it("round-trips the default menu", () => {
    const parsed = parseNav(navToText(primaryNav));
    expect(parsed).toEqual({ ok: true, value: primaryNav });
  });

  it("nests «-» lines under the link above", () => {
    const r = parseNav("Inicio | /\nTours | /tours\n- Grupos | /crea-tu-tour");
    expect(r).toEqual({
      ok: true,
      value: [
        { label: "Inicio", href: "/" },
        { label: "Tours", href: "/tours", children: [{ label: "Grupos", href: "/crea-tu-tour" }] },
      ],
    });
  });

  it("rejects unsafe or malformed links", () => {
    expect(parseNav("Inicio | /\nMal | javascript:alert(1)").ok).toBe(false);
    expect(parseNav("Inicio | /\nSin enlace").ok).toBe(false);
    expect(parseNav("- Huérfano | /x\nInicio | /").ok).toBe(false);
    expect(parseNav("Solo uno | /").ok).toBe(false);
  });
});

describe("footer text", () => {
  it("round-trips the default footer", () => {
    expect(parseFooter(footerToText(footerColumns))).toEqual({ ok: true, value: footerColumns });
  });

  it("needs a column title before links", () => {
    expect(parseFooter("Inicio | /").ok).toBe(false);
    expect(parseFooter("# Ayuda\nFAQ | /preguntas-frecuentes").ok).toBe(true);
    expect(parseFooter("# Vacía").ok).toBe(false);
  });
});

describe("home texts", () => {
  it("parses «Title | text» lines within limits", () => {
    expect(parsePairs("A | uno\nB | dos", "Motivos", [2, 8])).toEqual({
      ok: true,
      value: [
        { title: "A", body: "uno" },
        { title: "B", body: "dos" },
      ],
    });
    expect(parsePairs("A | uno", "Motivos", [2, 8]).ok).toBe(false);
    expect(parsePairs("A sin barra\nB | dos", "Motivos", [1, 8]).ok).toBe(false);
  });

  it("falls back to the defaults when nothing valid is stored", () => {
    expect(homeFromValue(undefined)).toEqual(HOME_DEFAULTS);
    expect(homeFromValue({ heroTitle: "  ", reasons: [{ title: "x" }] })).toEqual(HOME_DEFAULTS);
    expect(navFromValue("nope")).toEqual(primaryNav);
    expect(footerFromValue([])).toEqual(footerColumns);
  });

  it("keeps valid edits and the defaults for the rest", () => {
    const home = homeFromValue({
      heroTitle: "Nuevo título",
      steps: HOME_DEFAULTS.steps.slice(0, 3),
    });
    expect(home.heroTitle).toBe("Nuevo título");
    expect(home.steps).toHaveLength(3);
    expect(home.heroLead).toBe(HOME_DEFAULTS.heroLead);
    expect(pairsToText(home.steps).split("\n")).toHaveLength(3);
  });
});

describe("hero video link", () => {
  it("accepts blank, https and site paths to mp4/webm, rejects the rest", async () => {
    const { parseVideoUrl } = await import("@/lib/site-content-shared");
    expect(parseVideoUrl("")).toEqual({ ok: true, value: "" });
    expect(parseVideoUrl("https://x.supabase.co/storage/v1/object/public/media/hero.mp4").ok).toBe(
      true,
    );
    expect(parseVideoUrl("/video/hero.webm").ok).toBe(true);
    expect(parseVideoUrl("http://insecure.com/a.mp4").ok).toBe(false);
    expect(parseVideoUrl("https://youtube.com/watch?v=1").ok).toBe(false);
    expect(parseVideoUrl("//evil.com/a.mp4").ok).toBe(false);
  });
});
