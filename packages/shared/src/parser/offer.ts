import { containsBlacklistedTerm } from "../blacklist";
import type { ParsedOffer } from "../types";
import { extractCurrency, extractPhone, extractPrice, normalizeProductKey } from "./price";

export function parseOfferText(
  text: string,
  meta: Pick<ParsedOffer, "sourcePlatform" | "sourceUrl" | "externalGroupId">,
): ParsedOffer | null {
  if (!text.trim() || containsBlacklistedTerm(text)) return null;

  const priceOriginal = extractPrice(text);
  const currency = extractCurrency(text);

  return {
    productKey: normalizeProductKey(text),
    rawText: text.trim(),
    priceOriginal:
      priceOriginal != null && currency !== "UNKNOWN" ? priceOriginal : null,
    currency: priceOriginal != null && currency !== "UNKNOWN" ? currency : "UNKNOWN",
    phone: extractPhone(text),
    provinceId: null,
    sourceUrl: meta.sourceUrl,
    sourcePlatform: meta.sourcePlatform,
    externalGroupId: meta.externalGroupId,
    sourceChannelName: null,
    scrapedAt: new Date().toISOString(),
  };
}
