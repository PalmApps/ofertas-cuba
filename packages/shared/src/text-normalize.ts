/** Normaliza texto para comparar sin acentos ni mayúsculas. */
export function normalizeAscii(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Correcciones frecuentes en posts y titulos de grupos cubanos. */
const TYPO_FIXES: Record<string, string> = {
  revoliko: "revolico",
  rebolico: "revolico",
  revolic: "revolico",
  revolco: "revolico",
  revoliico: "revolico",
  revolicoo: "revolico",
  reboliko: "revolico",
  amoxcilina: "amoxicilina",
  amoxicilna: "amoxicilina",
  ifone: "iphone",
  ayfon: "iphone",
  iphon: "iphone",
  samsun: "samsung",
  sansung: "samsung",
  shiaomi: "xiaomi",
  neveraa: "nevera",
  librador: "liberado",
  arro: "arroz",
  lavadoraa: "lavadora",
  bici: "bicicleta",
  motocicleta: "moto",
  play: "playstation",
};

/** Variantes utiles al buscar (no canonical, solo expansion). */
const SEARCH_SYNONYMS: Record<string, string[]> = {
  revolico: ["revoliko", "rebolico"],
  ssp: ["sancti", "spiritus", "santi"],
  ss: ["sancti", "spiritus"],
  vcl: ["villa", "clara", "santa"],
  santa: ["clara"],
  clara: ["santa"],
};

export function fixCommonTypos(text: string): string {
  let out = normalizeAscii(text);
  for (const [typo, canonical] of Object.entries(TYPO_FIXES)) {
    out = out.replace(new RegExp(`\\b${typo}\\b`, "g"), canonical);
  }
  return out.replace(/\s+/g, " ").trim();
}

/** Tokens de busqueda: original, corregido, sinonimos y palabras sueltas. */
export function expandSearchTerms(query: string): string[] {
  const raw = query.trim().toLowerCase();
  const fixed = fixCommonTypos(query);
  const terms = new Set<string>();

  if (raw) terms.add(raw);
  if (fixed) terms.add(fixed);

  for (const token of fixed.split(" ").filter(Boolean)) {
    if (token.length >= 2) terms.add(token);
    const synonyms = SEARCH_SYNONYMS[token];
    if (synonyms) {
      for (const syn of synonyms) {
        if (syn.length >= 2) terms.add(syn);
      }
    }
  }

  return [...terms];
}

/** Etiquetas del canal/grupo para enriquecer busqueda (revolico, ssp, zona, etc.). */
export function channelSearchTags(title: string, username?: string): string {
  const parts = [title];
  if (username) {
    parts.push(username.replace(/_/g, " "));
  }
  return fixCommonTypos(parts.join(" "));
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
