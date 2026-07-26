import { and, desc, eq, ilike, inArray, isNull, or } from "drizzle-orm";
import {
  expandSearchTerms,
  fixCommonTypos,
  inferProvinceFromOfferText,
  normalizeAscii,
} from "@ofertas-cuba/shared";
import type { ParsedOffer } from "@ofertas-cuba/shared";
import type { Db } from "./client";
import { offers, reports } from "./schema";

export interface SearchOffersParams {
  query: string;
  /** Varias provincias (ej. ssp,vcl). null/[] = Toda Cuba. */
  provinceIds?: string[] | null;
  /** Compat: una sola provincia. */
  provinceId?: string | null;
  limit?: number;
}

function resolveProvinceFilter(
  params: SearchOffersParams,
): string[] | null {
  if (params.provinceIds?.length) return params.provinceIds;
  if (params.provinceId) return [params.provinceId];
  return null;
}

function queryTokens(query: string): string[] {
  const fixed = fixCommonTypos(query);
  return [...new Set(fixed.split(" ").filter((t) => t.length >= 2))];
}

function tokenMatch(token: string) {
  const variants = expandSearchTerms(token);
  return or(
    ...variants.flatMap((term) => [
      ilike(offers.productKey, `%${term}%`),
      ilike(offers.rawText, `%${term}%`),
    ]),
  );
}

function effectiveProvinceId(offer: {
  rawText: string;
  provinceId: string | null;
}): string | null {
  return inferProvinceFromOfferText(offer.rawText)?.id ?? offer.provinceId;
}

function filterByProvinces<T extends { rawText: string; provinceId: string | null }>(
  rows: T[],
  provinceIds: string[] | null,
): T[] {
  if (!provinceIds?.length) return rows;
  return rows.filter((row) => {
    const effective = effectiveProvinceId(row);
    if (effective == null) return true;
    return provinceIds.includes(effective);
  });
}
function dedupeOfferRows<T extends { rawText: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = normalizeAscii(row.rawText).slice(0, 160);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function searchOffers(db: Db, params: SearchOffersParams) {
  const limit = params.limit ?? 20;
  const tokens = queryTokens(params.query);
  if (tokens.length === 0) return [];

  let textMatch;
  if (tokens.length === 1) {
    textMatch = tokenMatch(tokens[0]!);
  } else {
    textMatch = and(...tokens.map((token) => tokenMatch(token)));
  }

  const conditions = [textMatch];
  const provinceIds = resolveProvinceFilter(params);

  if (provinceIds?.length) {
    conditions.push(
      or(
        inArray(offers.provinceId, provinceIds),
        isNull(offers.provinceId),
      ),
    );
  }

  const rows = await db
    .select()
    .from(offers)
    .where(and(...conditions))
    .orderBy(desc(offers.scrapedAt))
    .limit(limit * 3);

  return dedupeOfferRows(filterByProvinces(rows, provinceIds)).slice(0, limit);
}

export async function insertOffer(
  db: Db,
  offer: ParsedOffer & {
    priceUsd?: number | null;
    priceEur?: number | null;
    fbPostUrl?: string | null;
    telegramMessageUrl?: string | null;
  },
) {
  const values = {
    source:
      offer.sourcePlatform === "telegram_forward"
        ? "telegram_forward"
        : "scrape",
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
  };

  if (offer.telegramMessageUrl) {
    const [existing] = await db
      .select()
      .from(offers)
      .where(eq(offers.telegramMessageUrl, offer.telegramMessageUrl))
      .limit(1);
    if (existing) {
      const [updated] = await db
        .update(offers)
        .set(values)
        .where(eq(offers.id, existing.id))
        .returning();
      return updated;
    }
  }

  if (offer.fbPostUrl) {
    const [existing] = await db
      .select()
      .from(offers)
      .where(eq(offers.fbPostUrl, offer.fbPostUrl))
      .limit(1);
    if (existing) {
      const [updated] = await db
        .update(offers)
        .set(values)
        .where(eq(offers.id, existing.id))
        .returning();
      return updated;
    }
  }

  const [row] = await db.insert(offers).values(values).returning();
  return row;
}

export async function reportOffer(db: Db, offerId: string, reason?: string) {
  await db.insert(reports).values({ offerId, reason: reason ?? null });
  await db
    .update(offers)
    .set({ isReported: true })
    .where(eq(offers.id, offerId));
}
