/** Europe/Madrid wall-clock <-> UTC, for admin date/time inputs. */
const TZ = "Europe/Madrid";

function madridOffsetMinutes(instant: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(instant)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return Math.round((asUtc - Math.floor(instant.getTime() / 60_000) * 60_000) / 60_000);
}

/** "2026-11-22" + "08:00" in Madrid -> ISO UTC instant. */
export function madridToIso(date: string, time: string): string {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) throw new Error(`Invalid date/time ${date} ${time}`);
  const wall = Date.UTC(+d[1], +d[2] - 1, +d[3], +t[1], +t[2]);
  let ts = wall - madridOffsetMinutes(new Date(wall)) * 60_000;
  const corrected = wall - madridOffsetMinutes(new Date(ts)) * 60_000;
  if (corrected !== ts) ts = corrected; // DST transition day
  return new Date(ts).toISOString();
}

/** ISO instant -> Madrid { date: "YYYY-MM-DD", time: "HH:MM" } for inputs. */
export function isoToMadrid(iso: string): { date: string; time: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

/** Euros typed by a person ("55", "55,50", "55.5") -> integer cents. */
export function eurosToCents(value: string): number | null {
  const normalised = value.trim().replace(/\s|€/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalised)) return null;
  return Math.round(Number(normalised) * 100);
}
