import { jsonLdScript } from "@/lib/seo/json-ld";

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // Safe: jsonLdScript escapes "<", and data comes from our own database.
      dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }}
    />
  );
}
