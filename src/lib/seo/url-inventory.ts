import { splitCsvLine } from "@/lib/content/html-to-doc";

export type InventoryRow = {
  path: string; // old path, as listed (may end in "/" or "*")
  newPath: string;
  action: "keep" | "301" | "retire" | "pending";
  notes: string;
};

/** Rows of migration/urls.csv (US-03), with old URLs reduced to their path. */
export function parseInventory(csv: string): InventoryRow[] {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const header = splitCsvLine(lines.shift() ?? "");
  const col = (name: string) => header.indexOf(name);
  return lines.map((line) => {
    const c = splitCsvLine(line);
    return {
      path: c[col("old_url")].replace(/^https?:\/\/(www\.)?tripcelona\.com/, "") || "/",
      newPath: c[col("new_path")] ?? "",
      action: c[col("action")] as InventoryRow["action"],
      notes: c[col("notes")] ?? "",
    };
  });
}
