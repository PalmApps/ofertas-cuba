import { NextResponse } from "next/server";
import { createDb, reportOffer } from "@ofertas-cuba/db";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "db not configured" }, { status: 503 });
  }

  try {
    const db = createDb();
    await reportOffer(db, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "report failed" }, { status: 500 });
  }
}
