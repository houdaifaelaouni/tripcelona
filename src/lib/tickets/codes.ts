import { randomInt } from "node:crypto";
import { siteUrl } from "@/lib/seo/site-url";

/** No 0/O, 1/I: easy to read out loud at the bus door. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** 10 characters from 32 symbols (50 bits): unguessable, short enough to type. */
export function newTicketCode(): string {
  let out = "";
  for (let i = 0; i < 10; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

/** What the QR holds: the staff check-in page for this ticket. */
export const checkinUrl = (code: string) => `${siteUrl()}/admin/billetes/${code}`;

/** "ABCD EFGH JK", easier to read on paper. */
export const prettyCode = (code: string) => code.replace(/^(.{4})(.{4})(.{2})$/, "$1 $2 $3");
