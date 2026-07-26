import { NextResponse } from "next/server";
import { createDb, searchOffers } from "@ofertas-cuba/db";

function parseProvinceIds(raw: string | null): string[] | null {
  if (!raw || raw === "*" || raw === "todas") return null;
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.length ? ids : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const provinceIds = parseProvinceIds(searchParams.get("provincia"));

  if (!q) {
    return NextResponse.json({ error: "q required" }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ offers: [], message: "DATABASE_URL not configured" });
  }

  try {
    const db = createDb();
    const rows = await searchOffers(db, { query: q, provinceIds, limit: 30 });
    return NextResponse.json({ offers: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "search failed" }, { status: 500 });
  }
}
