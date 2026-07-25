import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  containsBlacklistedTerm,
  convertToUsdEur,
  extractCurrency,
  extractPhone,
  extractPrice,
  fetchElToqueRates,
  normalizeProductKey,
  type ParsedOffer,
} from "@ofertas-cuba/shared";
import { createDb, insertOffer } from "@ofertas-cuba/db";

const seedsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../docs/seeds",
);

export function loadJson<T>(filename: string): T {
  const raw = readFileSync(join(seedsDir, filename), "utf8");
  return JSON.parse(raw) as T;
}

export function parseOfferText(
  text: string,
  meta: Pick<ParsedOffer, "sourcePlatform" | "sourceUrl" | "externalGroupId">,
): ParsedOffer | null {
  if (!text.trim() || containsBlacklistedTerm(text)) return null;

  return {
    productKey: normalizeProductKey(text),
    rawText: text.trim(),
    priceOriginal: extractPrice(text),
    currency: extractCurrency(text),
    phone: extractPhone(text),
    provinceId: null,
    sourceUrl: meta.sourceUrl,
    sourcePlatform: meta.sourcePlatform,
    externalGroupId: meta.externalGroupId,
    scrapedAt: new Date().toISOString(),
  };
}

export async function persistOffers(offers: ParsedOffer[]): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.log(`[dry-run] ${offers.length} offers (DATABASE_URL not set)`);
    for (const offer of offers.slice(0, 3)) {
      console.log(JSON.stringify(offer, null, 2));
    }
    return;
  }

  const db = createDb();
  let rates = null;
  try {
    rates = await fetchElToqueRates();
  } catch (err) {
    console.warn("El Toque unavailable:", err);
  }

  for (const offer of offers) {
    let priceUsd: number | null = null;
    let priceEur: number | null = null;
    if (offer.priceOriginal != null && rates) {
      const converted = convertToUsdEur(
        offer.priceOriginal,
        offer.currency,
        rates,
      );
      priceUsd = converted.usd;
      priceEur = converted.eur;
    }

    await insertOffer(db, {
      ...offer,
      priceUsd,
      priceEur,
      fbPostUrl:
        offer.sourcePlatform === "facebook" ? offer.sourceUrl : null,
      telegramMessageUrl:
        offer.sourcePlatform === "telegram" ||
        offer.sourcePlatform === "telegram_forward"
          ? offer.sourceUrl
          : null,
    });
  }

  console.log(`[db] persisted ${offers.length} offers`);
}
