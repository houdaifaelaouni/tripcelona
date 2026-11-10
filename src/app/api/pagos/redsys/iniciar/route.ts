import { startPayment } from "@/lib/payments/service";
import { siteUrl } from "@/lib/seo/site-url";

/**
 * POST from the "Pagar con tarjeta" button. Answers with a tiny page that
 * posts the signed fields to Redsys (auto-submitted, with a button as the
 * no-JS fallback). Errors send the customer back to the pending page.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const bookingId = String(form.get("bookingId") ?? "");
  const result = await startPayment(bookingId);

  if (!result.ok) {
    const back = new URL("/reservar/pendiente", siteUrl());
    back.searchParams.set("id", bookingId);
    back.searchParams.set("pago", result.reason);
    return Response.redirect(back, 303);
  }

  const inputs = Object.entries(result.fields)
    .map(([name, value]) => `<input type="hidden" name="${name}" value="${escapeAttr(value)}">`)
    .join("");
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Redirigiendo al pago seguro…</title>
<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;color:#1a1f2b}
button{background:#0071c2;color:#fff;border:0;border-radius:8px;padding:14px 22px;font-size:16px;font-weight:700;cursor:pointer}</style>
</head><body><form id="redsys" method="post" action="${escapeAttr(result.action)}">${inputs}
<p>Te llevamos a la pasarela de pago segura del banco…</p>
<button type="submit">Ir al pago</button></form>
<script>document.getElementById("redsys").submit()</script></body></html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
