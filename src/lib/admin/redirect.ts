import { redirect } from "next/navigation";

/** Back to an admin page with a result message (see components/admin/flash). */
export function backWith(path: string, result: { ok: string } | { error: string }): never {
  const url = new URL(path, "http://admin.local");
  if ("ok" in result) url.searchParams.set("ok", result.ok);
  else url.searchParams.set("error", result.error);
  redirect(url.pathname + url.search);
}
