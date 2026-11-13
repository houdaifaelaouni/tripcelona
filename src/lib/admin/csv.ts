import "server-only";
import { checkStaff } from "@/lib/auth/staff";

/** Spreadsheet programs run cells that start with these characters as formulas. */
const FORMULA_START = /^[=+\-@\t\r]/;

function cell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (FORMULA_START.test(s)) s = `'${s}`;
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Semicolon-free CSV with a UTF-8 BOM so Excel opens accents correctly. */
export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((r) => r.map(cell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}

export function csvResponse(filename: string, body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

/** Owner-only guard for download routes: a plain status, never a redirect to HTML. */
export async function ownerOnly(): Promise<Response | null> {
  const check = await checkStaff("owner");
  if (check.status === "ok") return null;
  return new Response(check.status === "forbidden" ? "Forbidden" : "Unauthorized", {
    status: check.status === "forbidden" ? 403 : 401,
  });
}

export const stamp = () => new Date().toISOString().slice(0, 10);
