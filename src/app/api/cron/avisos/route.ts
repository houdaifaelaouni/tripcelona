import { NextResponse } from "next/server";
import { appSecret, ownerEmail } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send";
import { esc } from "@/lib/email/templates";
import { firingRules, loadAlertData, loadAlertRules } from "@/lib/ops/alert-data";
import { ruleSentence } from "@/lib/ops/alert-rules";
import { siteUrl } from "@/lib/seo/site-url";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Daily run (pg_cron job "avisos-daily", see migration 20261122000100):
 * emails the owner the "Avisos" rules set to "avisarme por email" that match
 * something today. Needs `Authorization: Bearer <CRON_SECRET>` (Vercel
 * variable or Vault); without a secret it never runs.
 */
export async function GET(req: Request) {
  const secret = await appSecret("CRON_SECRET");
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const to = await ownerEmail();
  if (!to) return NextResponse.json({ sent: false, reason: "OWNER_EMAIL missing" });

  const db = createAdminClient();
  const [rules, data] = await Promise.all([loadAlertRules(db), loadAlertData(db)]);
  const firing = firingRules(
    rules.filter((r) => r.action === "email"),
    data,
  );
  if (!firing.length) return NextResponse.json({ sent: false, firing: 0 });

  const base = siteUrl();
  const total = firing.reduce((n, f) => n + f.ev.hits.length, 0);
  const text = firing
    .map(
      ({ rule, ev }) =>
        `${ruleSentence(rule)}\n${ev.hits.map((h) => `- ${h.text}: ${base}${h.href}`).join("\n")}`,
    )
    .join("\n\n");
  const html = firing
    .map(
      ({ rule, ev }) =>
        `<h3 style="font:600 15px sans-serif;margin:20px 0 6px">${esc(ruleSentence(rule))}</h3><ul style="font:14px sans-serif;padding-left:18px">${ev.hits
          .map((h) => `<li><a href="${esc(base + h.href)}">${esc(h.text)}</a></li>`)
          .join("")}</ul>`,
    )
    .join("");
  const day = data.now.slice(0, 10);
  await sendEmail({
    to,
    subject: `Tripcelona: ${total} ${total === 1 ? "aviso" : "avisos"} hoy`,
    text: `${text}\n\nCambia estos avisos en ${base}/admin/avisos`,
    html: `${html}<p style="font:13px sans-serif;color:#667085;margin-top:24px">Cambia estos avisos en <a href="${esc(`${base}/admin/avisos`)}">Admin → Avisos</a>.</p>`,
    idempotencyKey: `avisos-${day}`,
  });
  return NextResponse.json({ sent: true, firing: firing.length, hits: total });
}
