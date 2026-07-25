import { NextResponse } from "next/server";
import { fetchElToqueRates } from "@ofertas-cuba/shared";

export async function GET() {
  try {
    const rates = await fetchElToqueRates();
    return NextResponse.json(rates);
  } catch (err) {
    const message = err instanceof Error ? err.message : "fx error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
