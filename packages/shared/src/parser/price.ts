import type { OfferCurrency } from "../types";

const CURRENCY_PATTERNS: Array<{ currency: OfferCurrency; pattern: RegExp }> = [
  { currency: "USD", pattern: /\b(usd|dolar(?:es)?|dlls?|us\$|\$)\b/i },
  { currency: "EUR", pattern: /\b(eur|euro?s?|€)\b/i },
  { currency: "MLC", pattern: /\b(mlc)\b/i },
  { currency: "CUP", pattern: /\b(cup|peso?s?|mn)\b/i },
];

const PHONE_PATTERN =
  /(?:\+53|53)?[\s-]?(?:5\d{7}|[2-4,6-9]\d{6,7})/;

/** Evita confundir modelos (iPhone 13) con precios — solo precios con moneda o keyword. */
const PRICE_WITH_CURRENCY =
  /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:usd|dolar(?:es)?|dlls?|us\$|\$|eur|€|mlc|cup|mn|pesos?)\b/i;

const CURRENCY_BEFORE_PRICE =
  /(?:usd|us\$|\$|eur|€|mlc|cup|mn|pesos?|dolar(?:es)?|dlls?)\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/i;

const PRICE_KEYWORD =
  /(?:precio|vale|por|x|a)\s*:?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/i;

export function extractPhone(text: string): string | null {
  const match = text.match(PHONE_PATTERN);
  return match ? match[0].replace(/\s|-/g, "") : null;
}

export function extractCurrency(text: string): OfferCurrency {
  for (const { currency, pattern } of CURRENCY_PATTERNS) {
    if (pattern.test(text)) return currency;
  }
  return "UNKNOWN";
}

function parseAmount(raw: string): number | null {
  const normalized = raw.trim();
  let value: number;

  if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(normalized)) {
    value = Number.parseFloat(normalized.replace(/\./g, "").replace(",", "."));
  } else if (/^\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?$/.test(normalized)) {
    value = Number.parseFloat(normalized.replace(/,/g, ""));
  } else {
    value = Number.parseFloat(normalized.replace(",", "."));
  }

  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function extractPrice(text: string): number | null {
  const patterns = [PRICE_WITH_CURRENCY, CURRENCY_BEFORE_PRICE, PRICE_KEYWORD];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1] || match.index == null) continue;

    const tail = text.slice(match.index + match[0].length, match.index + match[0].length + 6);
    if (/^\s*gb\b/i.test(tail) || /^\s*tb\b/i.test(tail)) continue;

    const value = parseAmount(match[1]);
    if (value != null) return value;
  }

  return null;
}

export function normalizeProductKey(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}
