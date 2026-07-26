import { levenshtein, normalizeAscii } from "./text-normalize";

export interface Province {
  id: string;
  name: string;
  slug: string;
}

/** 15 provincias + Isla de la Juventud */
export const PROVINCES: Province[] = [
  { id: "pin", name: "Pinar del Río", slug: "pinar-del-rio" },
  { id: "art", name: "Artemisa", slug: "artemisa" },
  { id: "hab", name: "La Habana", slug: "la-habana" },
  { id: "may", name: "Mayabeque", slug: "mayabeque" },
  { id: "mat", name: "Matanzas", slug: "matanzas" },
  { id: "vcl", name: "Villa Clara", slug: "villa-clara" },
  { id: "cfg", name: "Cienfuegos", slug: "cienfuegos" },
  { id: "ssp", name: "Sancti Spíritus", slug: "sancti-spiritus" },
  { id: "cav", name: "Ciego de Ávila", slug: "ciego-de-avila" },
  { id: "cmg", name: "Camagüey", slug: "camaguey" },
  { id: "ltu", name: "Las Tunas", slug: "las-tunas" },
  { id: "hol", name: "Holguín", slug: "holguin" },
  { id: "gra", name: "Granma", slug: "granma" },
  { id: "stg", name: "Santiago de Cuba", slug: "santiago-de-cuba" },
  { id: "gua", name: "Guantánamo", slug: "guantanamo" },
  { id: "ij", name: "Isla de la Juventud", slug: "isla-de-la-juventud" },
];

export const PROVINCE_BY_SLUG = Object.fromEntries(
  PROVINCES.map((p) => [p.slug, p]),
) as Record<string, Province>;

/** Abreviaturas frecuentes en titulos de grupos (Revolico SSP, etc.). */
const PROVINCE_ABBREVS: Record<string, Province["id"]> = {
  ssp: "ssp",
  ss: "ssp",
  vcl: "vcl",
  hab: "hab",
  stg: "stg",
  cmg: "cmg",
  hol: "hol",
  pin: "pin",
  cfg: "cfg",
  cav: "cav",
  ltu: "ltu",
  gra: "gra",
  gua: "gua",
  art: "art",
  may: "may",
  mat: "mat",
};

const PROVINCE_ALIASES: { pattern: string; id: Province["id"] }[] = [
  { pattern: "santiago de cuba", id: "stg" },
  { pattern: "la habana", id: "hab" },
  { pattern: "villa clara", id: "vcl" },
  { pattern: "santa clara", id: "vcl" },
  { pattern: "pinar del rio", id: "pin" },
  { pattern: "sancti spiritus", id: "ssp" },
  { pattern: "santi spiritus", id: "ssp" },
  { pattern: "santo spiritus", id: "ssp" },
  { pattern: "sancti espiritus", id: "ssp" },
  { pattern: "santi espiritus", id: "ssp" },
  { pattern: "sanctispiritus", id: "ssp" },
  { pattern: "ciego de avila", id: "cav" },
  { pattern: "las tunas", id: "ltu" },
  { pattern: "isla de la juventud", id: "ij" },
  { pattern: "habana", id: "hab" },
  { pattern: "camaguey", id: "cmg" },
  { pattern: "holguin", id: "hol" },
  { pattern: "matanzas", id: "mat" },
  { pattern: "granma", id: "gra" },
  { pattern: "guantanamo", id: "gua" },
  { pattern: "artemisa", id: "art" },
  { pattern: "mayabeque", id: "may" },
  { pattern: "cienfuegos", id: "cfg" },
];

/** Titulos compuestos: Revolico + provincia, compra venta + zona, etc. */
const CHANNEL_TITLE_PATTERNS: { test: RegExp; id: Province["id"] }[] = [
  {
    test: /revolico.*\b(ssp|ss\b|sancti|santi|santo)\b|\b(ssp|ss\b)\b.*revolico/,
    id: "ssp",
  },
  {
    test: /revolico.*(villa clara|santa clara|\bvcl\b)|\bvcl\b.*revolico/,
    id: "vcl",
  },
  {
    test: /revolico.*(santiago|\bstg\b)|\bstg\b.*revolico/,
    id: "stg",
  },
  {
    test: /revolico.*(camaguey|\bcmg\b)|\bcmg\b.*revolico/,
    id: "cmg",
  },
  {
    test: /revolico.*(holguin|\bhol\b)|\bhol\b.*revolico/,
    id: "hol",
  },
  {
    test: /revolico.*(habana|\bhab\b)|\bhab\b.*revolico/,
    id: "hab",
  },
  { test: /\bcompra venta\b.*\b(ssp|ss\b|sancti|spiritus)\b/, id: "ssp" },
  { test: /\bcompra venta\b.*(villa clara|santa clara)/, id: "vcl" },
];

function paddedHaystack(text: string): string {
  return ` ${normalizeAscii(text)} `;
}

export function findProvinceByName(input: string): Province | undefined {
  const normalized = normalizeAscii(input);
  const exact = PROVINCES.find(
    (p) =>
      normalizeAscii(p.name) === normalized ||
      p.slug === normalized ||
      p.id === normalized,
  );
  if (exact) return exact;

  const inferred = inferProvinceFromText(input);
  if (inferred) return inferred;

  let best: Province | undefined;
  let bestDistance = 3;
  for (const province of PROVINCES) {
    const distance = levenshtein(normalized, normalizeAscii(province.name));
    if (distance < bestDistance) {
      bestDistance = distance;
      best = province;
    }
  }

  return bestDistance <= 2 ? best : undefined;
}

/** Detecta provincia en titulos de canales/grupos (no en cada post). */
export function inferProvinceFromText(text: string): Province | undefined {
  const haystack = paddedHaystack(text);
  if (!haystack.trim()) return undefined;

  for (const { test, id } of CHANNEL_TITLE_PATTERNS) {
    if (test.test(haystack)) {
      return PROVINCES.find((p) => p.id === id);
    }
  }

  for (const [abbrev, id] of Object.entries(PROVINCE_ABBREVS)) {
    if (haystack.includes(` ${abbrev} `)) {
      return PROVINCES.find((p) => p.id === id);
    }
  }

  const byName = [...PROVINCES].sort(
    (a, b) => b.name.length - a.name.length,
  );
  for (const province of byName) {
    if (haystack.includes(` ${normalizeAscii(province.name)} `)) {
      return province;
    }
  }

  for (const alias of PROVINCE_ALIASES) {
    if (haystack.includes(` ${alias.pattern} `)) {
      return PROVINCES.find((p) => p.id === alias.id);
    }
  }

  return undefined;
}
