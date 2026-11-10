// Concurrency test for seat holds (US-08 acceptance, later FR-31 / US-23).
// Needs the local Supabase stack: `pnpm supabase start`.
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const DB_URL =
  process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const PARALLEL = 10;

const pool = new Pool({ connectionString: DB_URL, max: PARALLEL + 2 });
const slug = `concurrency-${randomUUID().slice(0, 8)}`;
let departureId: string;

beforeAll(async () => {
  const { rows } = await pool.query<{ id: string }>(
    `with t as (insert into public.tours (slug, title, status) values ($1, 'Concurrency', 'published') returning id)
     insert into public.tour_departures (tour_id, starts_at, capacity, price_cents)
     select id, now() + interval '7 days', 1, 5000 from t returning id`,
    [slug],
  );
  departureId = rows[0].id;
});

afterAll(async () => {
  await pool.query(`delete from public.tours where slug = $1`, [slug]);
  await pool.end();
});

async function holdAsServiceRole(qty: number): Promise<string | null> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("set local role service_role");
    const { rows } = await client.query<{ hold: string | null }>(
      "select public.hold_seats($1, $2) as hold",
      [departureId, qty],
    );
    await client.query("commit");
    return rows[0].hold;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

describe("hold_seats under concurrency", () => {
  it(`${PARALLEL} parallel holds on 1 seat yield exactly one success`, async () => {
    const results = await Promise.all(Array.from({ length: PARALLEL }, () => holdAsServiceRole(1)));
    const successes = results.filter((r) => r !== null);
    expect(successes).toHaveLength(1);

    const { rows } = await pool.query(
      "select seats_taken, capacity, status from public.tour_departures where id = $1",
      [departureId],
    );
    expect(rows[0]).toEqual({ seats_taken: 1, capacity: 1, status: "sold_out" });
  });
});
