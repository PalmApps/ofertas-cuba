import { and, desc, eq, ilike } from "drizzle-orm";
import type { ParsedOffer } from "@ofertas-cuba/shared";
import type { Db } from "./client";
import { offers, reports } from "./schema";

export interface SearchOffersParams {
  query: string;
  provinceId?: string | null;
  limit?: number;
}

export async function searchOffers(db: Db, params: SearchOffersParams) {
  const q = params.query.trim().toLowerCase();
  const limit = params.limit ?? 20;
  const conditions = [ilike(offers.productKey, `%${q}%`)];

  if (params.provinceId) {
    conditions.push(eq(offers.provinceId, params.provinceId));
  }

  return db
    .select()
    .from(offers)
    .where(and(...conditions))
    .orderBy(desc(offers.scrapedAt))
    .limit(limit);
}

export async function insertOffer(db: Db, offer: ParsedOffer & {
  priceUsd?: number | null;
  priceEur?: number | null;
  fbPostUrl?: string | null;
  telegramMessageUrl?: string | null;
}) {
  const [row] = await db
    .insert(offers)
    .values({
      source: offer.sourcePlatform === "telegram_forward" ? "telegram_forward" : "scrape",
      sourcePlatform: offer.sourcePlatform,
      rawText: offer.rawText,
      productKey: offer.productKey,
      priceOriginal: offer.priceOriginal?.toString() ?? null,
      currency: offer.currency,
      priceUsd: offer.priceUsd?.toString() ?? null,
      priceEur: offer.priceEur?.toString() ?? null,
      phone: offer.phone,
      fbPostUrl: offer.fbPostUrl ?? null,
      telegramMessageUrl: offer.telegramMessageUrl ?? null,
      provinceId: offer.provinceId,
      scrapedAt: new Date(offer.scrapedAt),
    })
    .returning();
  return row;
}

export async function reportOffer(db: Db, offerId: string, reason?: string) {
  await db.insert(reports).values({ offerId, reason: reason ?? null });
  await db
    .update(offers)
    .set({ isReported: true })
    .where(eq(offers.id, offerId));
}
