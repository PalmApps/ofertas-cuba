import type { OfferCurrency } from "../types";
import { fixCommonTypos } from "../text-normalize";

const CURRENCY_PATTERNS: Array<{ currency: OfferCurrency; pattern: RegExp }> = [
  { currency: "USD", pattern: /\b(usd|dolar(?:es)?|dlls?|us\$)\b/i },
  { currency: "EUR", pattern: /\b(eur|euro?s?|€)\b/i },
  { currency: "MLC", pattern: /\b(mlc)\b/i },
  { currency: "CUP", pattern: /\b(cup|peso?s?|mn)\b/i },
];

const PHONE_PATTERN =
  /(?:\+53|53)?[\s-]?(?:5\d{7}|[2-4,6-9]\d{6,7})/;

/** Precio con moneda explicita en la misma frase. */
const PRICE_WITH_CURRENCY =
  /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:usd|dolar(?:es)?|dlls?|us\$|eur|€|mlc|cup|mn|pesos?)\b/i;

const CURRENCY_BEFORE_PRICE =
  /(?:usd|us\$|eur|€|mlc|cup|mn|pesos?|dolar(?:es)?|dlls?)\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/i;

/** Solo palabras claras de precio — evita falsos positivos con "a", "x", "por". */
const PRICE_KEYWORD =
  /(?:precio|vale|costo|cobra|cobro|sale en|pago)\s*:?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/i;

/** $ suelto no cuenta como moneda; exige USD/dlls o simbolo junto al numero. */
const USD_INLINE = /\$\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/i;

export function extractPhone(text: string): string | null {
  const match = text.match(PHONE_PATTERN);
  return match ? match[0].replace(/\s|-/g, "") : null;
}

export function extractCurrency(text: string): OfferCurrency {
  for (const { currency, pattern } of CURRENCY_PATTERNS) {
    if (pattern.test(text)) return currency;
  }
  if (USD_INLINE.test(text)) return "USD";
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

function isStorageSuffix(text: string, index: number, matchLen: number): boolean {
  const tail = text.slice(index + matchLen, index + matchLen + 6);
  return /^\s*gb\b/i.test(tail) || /^\s*tb\b/i.test(tail);
}

function readPriceMatch(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  if (!match?.[1] || match.index == null) return null;
  if (isStorageSuffix(text, match.index, match[0].length)) return null;
  return parseAmount(match[1]);
}

export function extractPrice(text: string): number | null {
  const withCurrency = readPriceMatch(text, PRICE_WITH_CURRENCY);
  if (withCurrency != null) return withCurrency;

  const currencyFirst = readPriceMatch(text, CURRENCY_BEFORE_PRICE);
  if (currencyFirst != null) return currencyFirst;

  const dollarInline = readPriceMatch(text, USD_INLINE);
  if (dollarInline != null) return dollarInline;

  // Palabra clave solo si hay moneda reconocible en el texto.
  if (extractCurrency(text) === "UNKNOWN") return null;

  return readPriceMatch(text, PRICE_KEYWORD);
}

export function normalizeProductKey(text: string): string {
  return fixCommonTypos(text)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

/** Primera linea del post para mostrar como titulo. */
export function offerPreviewTitle(text: string, maxLen = 90): string {
  const line = text.split(/\n/).map((l) => l.trim()).find(Boolean) ?? text.trim();
  if (line.length <= maxLen) return line;
  return `${line.slice(0, maxLen - 1)}…`;
}

/** @username desde URL t.me/username/msgId */
export function channelNameFromTelegramUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/t\.me\/([^/]+)/i);
  return match?.[1] ? `@${match[1]}` : null;
}
