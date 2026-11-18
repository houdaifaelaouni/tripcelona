import type { PhotoCredit as Credit } from "@/lib/photos/library";
import { cn } from "@/lib/cn";

/**
 * Small credit line for a photo or video: author, licence and source.
 * Pass `link={false}` inside an element that is already a link (cards,
 * destination tiles), where a nested link isn't allowed; the full list with
 * links is on /creditos.
 */
export function PhotoCredit({
  credit,
  className,
  link = true,
}: {
  credit: Credit | null | undefined;
  className?: string;
  link?: boolean;
}) {
  if (!credit) return null;
  const text = `© ${credit.author} · ${credit.license}`;
  const classes = cn(
    "pointer-events-auto absolute right-2 bottom-2 z-10 max-w-[85%] truncate rounded-full bg-black/75 px-2 py-0.5 text-[10px] leading-4 font-medium text-white",
    className,
  );
  return link ? (
    <a
      href={credit.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`${text} (${credit.source})`}
      className={cn(classes, "hover:bg-black/90")}
    >
      {text}
    </a>
  ) : (
    <span title={`${text} (${credit.source})`} className={classes}>
      {text}
    </span>
  );
}
