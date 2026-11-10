import "server-only";

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
  replyTo?: string;
};

/**
 * Sends through the Resend HTTP API. Without RESEND_API_KEY (local dev,
 * previews) the email is logged instead, so flows can be tested end to end.
 */
export async function sendEmail(email: OutgoingEmail): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.info(`[email:dev] to=${email.to} subject="${email.subject}"`);
    return { id: `dev-${email.idempotencyKey}` };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": email.idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
      ...(email.replyTo ? { reply_to: email.replyTo } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = (await res.json()) as { id?: string };
  return { id: body.id ?? "unknown" };
}
