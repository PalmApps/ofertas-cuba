import { runTelegramScraper } from "@ofertas-cuba/scraper/telegram";
import { NextResponse } from "next/server";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return true;

  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runTelegramScraper();
    return NextResponse.json({
      ok: true,
      source: "vercel",
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "scrape failed";
    console.error("scrape-telegram:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
