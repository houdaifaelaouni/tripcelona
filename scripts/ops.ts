/**
 * Owner and operator commands (US-21, US-22, US-41). Most of this is also in
 * the admin; the CLI is for support and for scheduled checks.
 *
 *   pnpm ops health [hours]                 daily health report (exit 2 on P0)
 *   pnpm ops resend <TC-YYYY-NNNN> [confirmation|owner_alert|payment_failed|cancellation]
 *   pnpm ops refund <TC-YYYY-NNNN>          refund a paid booking and free its seats
 *   pnpm ops cancel-departure <departure-uuid>   cancel, refund and notify everyone
 *   pnpm ops grant-staff <email> <owner|editor> [password]   first owner / extra staff
 *
 * Reads .env.local (or the shell env): Supabase service role, Redsys, Resend.
 */
import { getBookingDetails } from "@/lib/booking/details";
import { sendBookingEmail } from "@/lib/email/booking-emails";
import type { EmailKind } from "@/lib/email/templates";
import { grantStaff } from "@/lib/admin/staff-admin";
import { assessHealth, loadHealthInput } from "@/lib/ops/health";
import { cancelDeparture, refundBooking } from "@/lib/payments/service";
import { createAdminClient } from "@/lib/supabase/admin";

const KINDS: EmailKind[] = [
  "confirmation",
  "owner_alert",
  "payment_failed",
  "payment_request",
  "cancellation",
];

async function bookingByRef(reference: string) {
  const booking = await getBookingDetails({ reference });
  if (!booking) throw new Error(`No booking ${reference}`);
  return booking;
}

async function main() {
  const [command, arg, extra, more] = process.argv.slice(2);
  switch (command) {
    case "resend": {
      const kind = (extra ?? "confirmation") as EmailKind;
      if (!KINDS.includes(kind)) throw new Error(`Unknown email kind ${kind}`);
      const booking = await bookingByRef(arg);
      console.log(await sendBookingEmail(booking.id, kind, { force: true }));
      break;
    }
    case "refund": {
      const booking = await bookingByRef(arg);
      if (booking.status !== "paid") throw new Error(`${arg} is ${booking.status}, not paid`);
      console.log(
        await refundBooking(booking.id, { releaseSeats: true, notify: true, scope: "booking" }),
      );
      break;
    }
    case "cancel-departure": {
      console.log(JSON.stringify(await cancelDeparture(arg), null, 2));
      break;
    }
    case "grant-staff": {
      if (extra !== "owner" && extra !== "editor") throw new Error("Role must be owner or editor");
      // Without a password the person gets an invite email (needs Supabase SMTP).
      console.log(await grantStaff(arg, extra, { password: more }));
      break;
    }
    case "health": {
      const hours = Number(arg ?? 24);
      if (!Number.isFinite(hours) || hours <= 0) throw new Error("Hours must be a positive number");
      const report = assessHealth(await loadHealthInput(createAdminClient(), hours));
      const pct =
        report.funnel.conversion === null ? "–" : `${Math.round(report.funnel.conversion * 100)}%`;
      console.log(`Estado (${hours} h): ${report.status.toUpperCase()}`);
      console.log(
        `Reservas iniciadas ${report.funnel.started}, pagadas ${report.funnel.paid} (${pct}), abandonadas ${report.funnel.abandoned}; pagos rechazados ${report.paymentsFailed}; emails enviados ${report.emailsSent}`,
      );
      for (const a of report.alerts) {
        console.log(
          `\n[${a.severity}] ${a.title}\n  ${a.detail}${a.refs.length ? `\n  ${a.refs.join(", ")}` : ""}`,
        );
      }
      if (report.status === "critical") process.exitCode = 2;
      break;
    }
    default:
      console.error("Usage: pnpm ops health|resend|refund|cancel-departure|grant-staff <args>");
      process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
