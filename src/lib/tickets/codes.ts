import { siteUrl } from "@/lib/seo/site-url";

/**
 * What the e-ticket QR holds: the staff check-in page of that booking. The
 * page needs a staff login, so the (sequential) reference is enough.
 */
export const checkinUrl = (reference: string) =>
  `${siteUrl()}/admin/billetes/${encodeURIComponent(reference)}`;

export const isReference = (v: string) => /^TC-\d{4}-\d{3,8}$/.test(v);
