import { containsBlacklistedTerm } from "../blacklist";
import { extractPrice } from "./price";

const OFFER_HINT =
  /\b(vendo|venta|compro|busco|precio|usd|eur|mlc|cup|\$|€|iphone|laptop|arroz)\b/i;

export function looksLikeOffer(text: string): boolean {
  if (!text.trim() || containsBlacklistedTerm(text)) return false;
  if (extractPrice(text) != null) return true;
  return OFFER_HINT.test(text);
}
