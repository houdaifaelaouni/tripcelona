import { handlePaycometNotification } from "@/lib/payments/service";

/**
 * PAYCOMET server-to-server notification (URLNOTIFY, set in the control
 * panel: Mis productos > Configurar producto). This, not the customer's
 * browser returning to URLOK, confirms a booking (US-20). PAYCOMET posts
 * form fields; the NotificationHash is checked before anything is stored.
 */
export async function POST(request: Request) {
  let fields: Record<string, string>;
  try {
    const type = request.headers.get("content-type") ?? "";
    if (type.includes("application/json")) {
      fields = (await request.json()) as Record<string, string>;
    } else {
      const form = await request.formData();
      fields = Object.fromEntries(
        [...form.entries()].flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])),
      );
    }
  } catch {
    return new Response("Invalid notification", { status: 400 });
  }

  const outcome = await handlePaycometNotification(fields);
  if (outcome === "invalid_signature" || outcome === "not_configured") {
    console.warn(`[paycomet] notification rejected: ${outcome}`);
    return new Response("Invalid notification", { status: 400 });
  }
  console.info(`[paycomet] notification ${outcome}`);
  return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}
