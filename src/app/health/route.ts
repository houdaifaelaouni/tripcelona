import { connection } from "next/server";

export async function GET() {
  await connection(); // opt out of prerendering: always answer live
  return Response.json(
    {
      status: "ok",
      service: "tripcelona-web",
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
      env: process.env.VERCEL_ENV ?? "development",
      time: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
