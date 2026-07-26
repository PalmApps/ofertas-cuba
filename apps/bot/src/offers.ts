import {
  convertToUsdEur,
  fetchElToqueRates,
  parseOfferText,
  resolveOfferProvinceId,
} from "@ofertas-cuba/shared";
import { createDb, insertOffer, searchOffers } from "@ofertas-cuba/db";

function useDb(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function indexForwardedOffer(
  text: string,
  provinceId: string | null,
  sourceUrl: string | null = null,
  sourcePlatform: "telegram_forward" | "telegram" = "telegram_forward",
): Promise<boolean> {
  const parsed = parseOfferText(text, {
    sourcePlatform,
    sourceUrl,
    externalGroupId: sourceUrl ?? `bot:${Date.now()}`,
  });

  if (!parsed) return false;
  parsed.provinceId = resolveOfferProvinceId(text, provinceId);

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
    telegramMessageUrl: sourceUrl,
    fbPostUrl: null,
  });

  return true;
}

export async function searchProductOffers(
  query: string,
  provinceId: string | null,
  limit = 5,
) {
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://ofertascuba.vercel.app"
  ).replace(/\/$/, "");
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });
  if (provinceId) params.set("provincia", provinceId);

  try {
    const res = await fetch(`${appUrl}/api/offers/search?${params}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as {
        offers?: Awaited<ReturnType<typeof searchOffers>>;
      };
      return data.offers ?? [];
    }
  } catch (err) {
    console.warn("searchProductOffers via API failed:", err);
  }

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
