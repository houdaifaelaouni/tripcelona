import "server-only";

type Db = ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>;

/**
 * Migrations the owner runs by hand in the Supabase SQL editor. Each one is
 * probed by a column or table it adds: if the probe fails, the code on the
 * site already expects that SQL and parts of it break until it is run.
 */
const PROBES: { file: string; what: string; table: string; column: string }[] = [
  {
    file: "20261113000100_cart.sql",
    what: "carrito (varias excursiones en un pago)",
    table: "payments",
    column: "cart_id",
  },
  {
    file: "20261113000200_content_translations.sql",
    what: "traducciones del contenido",
    table: "content_translations",
    column: "entity_id",
  },
  {
    file: "20261113000300_payment_credentials.sql",
    what: "claves de pago desde el panel",
    table: "payment_credentials",
    column: "name",
  },
  {
    file: "20261121000100_passenger_tickets.sql",
    what: "formulario de pasajeros y billete por email",
    table: "bookings",
    column: "passengers_completed_at",
  },
];

export type PendingMigration = { file: string; what: string };

/** SQL files the code needs but the database does not have yet. */
export async function pendingMigrations(db: Db): Promise<PendingMigration[]> {
  const results = await Promise.all(
    PROBES.map(async (p) => {
      const { error } = await db
        .from(p.table as "bookings")
        .select(p.column as "id")
        .limit(0);
      // 42703 undefined column, 42P01 / PGRST205 unknown table, PGRST204 unknown column.
      const missing =
        !!error && /^(42703|42P01|PGRST20[45])$/.test(error.code ?? "")
          ? { file: p.file, what: p.what }
          : null;
      return missing;
    }),
  );
  return results.filter((r): r is PendingMigration => r !== null);
}
