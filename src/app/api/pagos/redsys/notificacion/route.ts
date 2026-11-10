import { handleRedsysNotification } from "@/lib/payments/service";

/**
 * Redsys server-to-server notification (DS_MERCHANT_MERCHANTURL). This, not
 * the customer's browser returning to URLOK, confirms a booking (US-20).
 */
export async function POST(request: Request) {
  let fields: Record<string, string | null>;
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    fields = (await request.json()) as Record<string, string | null>;
  } else {
    const form = await request.formData();
    fields = {
      Ds_MerchantParameters: form.get("Ds_MerchantParameters")?.toString() ?? null,
      Ds_Signature: form.get("Ds_Signature")?.toString() ?? null,
    };
  }

  const outcome = await handleRedsysNotification(fields);
  if (outcome === "invalid_signature" || outcome === "not_configured") {
    console.warn(`[redsys] notification rejected: ${outcome}`);
    return new Response("Invalid notification", { status: 400 });
  }
  console.info(`[redsys] notification ${outcome}`);
  return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}
