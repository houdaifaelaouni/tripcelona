/** Only same-site admin paths are allowed as a post-login destination. */
export function safeAdminNext(value: unknown, fallback = "/admin"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/admin") || value.startsWith("//") || value.includes("\\"))
    return fallback;
  if (value.startsWith("/admin/login") || value.startsWith("/admin/auth")) return fallback;
  return value;
}
