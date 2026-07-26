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

export function findProvinceByName(input: string): Province | undefined {
  const normalized = input.trim().toLowerCase();
  return PROVINCES.find(
    (p) =>
      p.name.toLowerCase() === normalized ||
      p.slug === normalized ||
      p.id === normalized,
  );
}

function normalizeProvinceHint(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

const PROVINCE_ALIASES: { pattern: string; id: Province["id"] }[] = [
  { pattern: "santiago de cuba", id: "stg" },
  { pattern: "la habana", id: "hab" },
  { pattern: "villa clara", id: "vcl" },
  { pattern: "santa clara", id: "vcl" },
  { pattern: "pinar del rio", id: "pin" },
  { pattern: "sancti spiritus", id: "ssp" },
  { pattern: "santi spiritus", id: "ssp" },
  { pattern: " y ss ", id: "ssp" },
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

/** Detecta provincia en titulos de canales/grupos (no en cada post). */
export function inferProvinceFromText(text: string): Province | undefined {
  const haystack = normalizeProvinceHint(text);
  if (!haystack.trim()) return undefined;

  const byName = [...PROVINCES].sort(
    (a, b) => b.name.length - a.name.length,
  );
  for (const province of byName) {
    if (haystack.includes(normalizeProvinceHint(province.name))) {
      return province;
    }
  }

  for (const alias of PROVINCE_ALIASES) {
    if (haystack.includes(alias.pattern)) {
      return PROVINCES.find((p) => p.id === alias.id);
    }
  }

  return undefined;
}
