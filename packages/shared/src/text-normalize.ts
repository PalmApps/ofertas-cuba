/** Normaliza texto para comparar sin acentos ni mayúsculas. */
export function normalizeAscii(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Correcciones frecuentes en posts de compra/venta cubanos. */
const TYPO_FIXES: Record<string, string> = {
  amoxcilina: "amoxicilina",
  amoxicilna: "amoxicilina",
  amoxicilina: "amoxicilina",
  ifone: "iphone",
  ayfon: "iphone",
  iphon: "iphone",
  samsun: "samsung",
  sansung: "samsung",
  xiaomi: "xiaomi",
  shiaomi: "xiaomi",
  neveraa: "nevera",
  nevera: "nevera",
  librador: "liberado",
  liberado: "liberado",
  arro: "arroz",
  arroz: "arroz",
  lavadora: "lavadora",
  lavadoraa: "lavadora",
  bicicleta: "bicicleta",
  bici: "bicicleta",
  moto: "moto",
  motocicleta: "moto",
  play: "playstation",
  playstation: "playstation",
  lavamanos: "lavamanos",
  split: "split",
  aire: "aire",
  acondicionado: "acondicionado",
  venta: "venta",
  vendo: "vendo",
  compro: "compro",
};

export function fixCommonTypos(text: string): string {
  let out = normalizeAscii(text);
  for (const [typo, canonical] of Object.entries(TYPO_FIXES)) {
    out = out.replace(new RegExp(`\\b${typo}\\b`, "g"), canonical);
  }
  return out.replace(/\s+/g, " ").trim();
}

/** Variantes de busqueda (query original + corregida + tokens). */
export function expandSearchTerms(query: string): string[] {
  const raw = query.trim().toLowerCase();
  const fixed = fixCommonTypos(query);
  const terms = new Set<string>();

  if (raw) terms.add(raw);
  if (fixed) terms.add(fixed);

  for (const token of fixed.split(" ")) {
    if (token.length >= 3) terms.add(token);
  }

  return [...terms];
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const next = Math.min(row[j] + 1, prev + 1, row[j - 1] + cost);
      row[j - 1] = prev;
      prev = next;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}
