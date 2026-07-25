import {
  convertToUsdEur,
  fetchElToqueRates,
  parseOfferText,
} from "@ofertas-cuba/shared";
import { createDb, insertOffer, searchOffers } from "@ofertas-cuba/db";

function useDb(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function indexForwardedOffer(
  text: string,
  provinceId: string | null,
): Promise<boolean> {
  const parsed = parseOfferText(text, {
    sourcePlatform: "telegram_forward",
    sourceUrl: null,
    externalGroupId: `bot:${Date.now()}`,
  });

  if (!parsed) return false;
  parsed.provinceId = provinceId;

  if (!useDb()) return true;

  const db = createDb();
  let priceUsd: number | null = null;
  let priceEur: number | null = null;

  try {
    const rates = await fetchElToqueRates();
    if (parsed.priceOriginal != null) {
      const converted = convertToUsdEur(
        parsed.priceOriginal,
        parsed.currency,
        rates,
      );
      priceUsd = converted.usd;
      priceEur = converted.eur;
    }
  } catch {
    // FX opcional en reenvios
  }

  await insertOffer(db, {
    ...parsed,
    priceUsd,
    priceEur,
    telegramMessageUrl: null,
    fbPostUrl: null,
  });

  return true;
}

export async function searchProductOffers(
  query: string,
  provinceId: string | null,
  limit = 5,
) {
  if (!useDb()) return [];

  const db = createDb();
  return searchOffers(db, { query, provinceId, limit });
}

export function formatOfferLine(offer: {
  productKey: string;
  priceOriginal: string | null;
  currency: string | null;
  priceUsd: string | null;
}): string {
  const title = offer.productKey.slice(0, 60);
  if (offer.priceOriginal && offer.currency && offer.currency !== "UNKNOWN") {
    const usd =
      offer.priceUsd != null ? ` (~${Number(offer.priceUsd).toFixed(0)} USD)` : "";
    return `• ${title} — ${offer.priceOriginal} ${offer.currency}${usd}`;
  }
  return `• ${title}`;
}
