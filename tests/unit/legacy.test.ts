import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canonicalRedirect, isGone, slugLookup } from "@/lib/seo/legacy";
import { parseInventory } from "@/lib/seo/url-inventory";

const rows = parseInventory(readFileSync("migration/urls.csv", "utf8"));

describe("legacy URL inventory (migration/urls.csv)", () => {
  it("has a known action on every row", () => {
    expect(rows.length).toBeGreaterThan(30);
    for (const r of rows) expect(["keep", "301", "retire", "pending"]).toContain(r.action);
  });

  for (const r of rows.filter((r) => !r.path.includes("*"))) {
    it(`${r.path} → ${r.action} ${r.newPath}`, () => {
      const target = canonicalRedirect(r.path) ?? r.path;
      if (r.action === "retire") expect(isGone(r.path.replace(/\/$/, ""))).toBe(true);
      else expect(target).toBe(r.newPath);
      // One hop: the target is already canonical.
      if (r.action !== "retire") expect(canonicalRedirect(target)).toBeNull();
    });
  }

  it("retires WordPress endpoints with 410", () => {
    for (const p of ["/wp-admin", "/wp-admin/post.php", "/wp-login.php", "/xmlrpc.php", "/feed"])
      expect(isGone(p)).toBe(true);
    expect(isGone("/blog")).toBe(false);
  });
});

describe("canonicalRedirect", () => {
  it("removes trailing slashes but keeps the home page", () => {
    expect(canonicalRedirect("/blog/")).toBe("/blog");
    expect(canonicalRedirect("/")).toBeNull();
    expect(canonicalRedirect("/blog")).toBeNull();
  });
  it("maps any old product slug to the excursion with the same slug", () => {
    expect(canonicalRedirect("/product/nueva-ruta/")).toBe("/excursiones/nueva-ruta");
  });
});

describe("slugLookup", () => {
  it("names the table each dynamic path depends on", () => {
    expect(slugLookup("/blog/hola")).toEqual({ kind: "post", slug: "hola" });
    expect(slugLookup("/excursiones/rupit")).toEqual({ kind: "tour", slug: "rupit" });
    expect(slugLookup("/aviso-legal")).toEqual({ kind: "page", slug: "aviso-legal" });
  });
  it("leaves own routes and files alone", () => {
    for (const p of [
      "/",
      "/blog",
      "/reservar",
      "/ofertas-de-viajes",
      "/robots.txt",
      "/sitemap.xml",
      "/reservar/confirmada",
    ])
      expect(slugLookup(p)).toBeNull();
  });
});
