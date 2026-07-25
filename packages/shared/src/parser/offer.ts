import { containsBlacklistedTerm } from "../blacklist";
import type { ParsedOffer } from "../types";
import { extractCurrency, extractPhone, extractPrice, normalizeProductKey } from "./price";

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
