import { containsBlacklistedTerm } from "../blacklist";
import { extractPhone, extractPrice } from "./price";

const OFFER_HINT =
  /\b(vendo|venta|vende|compro|compra|busco|precio|usd|eur|mlc|cup|\$|€|iphone|samsung|laptop|arroz|remato|permuto|intercambio|whats|whatsapp|liber|nevera|split|bicicleta|moto|carro|auto|play|tv|celular|móvil|movil)\b/i;

export function looksLikeOffer(text: string): boolean {
  if (!text.trim() || containsBlacklistedTerm(text)) return false;
  if (extractPrice(text) != null) return true;
  if (OFFER_HINT.test(text) && extractPhone(text)) return true;
  return OFFER_HINT.test(text);
}
