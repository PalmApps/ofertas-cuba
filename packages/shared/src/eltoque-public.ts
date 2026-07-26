import type { ElToqueRates } from "./eltoque";

type RateField = "usdCup" | "eurCup" | "mlcCup";

const CURRENCY_CELL_IDS: Record<string, RateField> = {
  "0": "usdCup",
  "1": "eurCup",
  "2": "mlcCup",
};

/** Tasas publicadas en eltoque.com cuando no hay API key. */
export async function fetchPublicElToqueRates(): Promise<ElToqueRates> {
  const res = await fetch("https://eltoque.com/", {
    headers: { Accept: "text/html", "User-Agent": "OfertasCuba/0.1" },
  });

  if (!res.ok) {
    throw new Error(`eltoque.com ${res.status}`);
  }

  const html = await res.text();
  const rates: ElToqueRates = {
    date: new Date().toISOString().slice(0, 10),
    usdCup: null,
    eurCup: null,
    mlcCup: null,
  };

  for (const [cellId, field] of Object.entries(CURRENCY_CELL_IDS)) {
    const match = html.match(
      new RegExp(
        `id="cell-title-v2-${cellId}"[\\s\\S]{0,400}?(\\d+(?:\\.\\d+)?)<!--\\s*-->\\s*CUP`,
      ),
    );
    if (match) {
      rates[field] = Number.parseFloat(match[1]);
    }
  }

  if (!rates.usdCup && !rates.eurCup) {
    throw new Error("Could not parse public elTOQUE rates");
  }

  return rates;
}
