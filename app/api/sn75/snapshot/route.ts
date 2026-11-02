import { connection } from "next/server";
import { buildSnapshot } from "@/lib/snapshot";

export async function GET() {
  await connection();
  const snapshot = buildSnapshot(Date.now());
  return Response.json(snapshot, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
