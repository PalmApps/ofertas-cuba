export interface ElToqueRates {
  date: string;
  usdCup: number | null;
  eurCup: number | null;
  mlcCup: number | null;
}

interface TrmiResponse {
  tasas?: Record<string, { median?: number; value?: number } | number>;
  data?: Record<string, number>;
}

function pickRate(
  tasas: Record<string, { median?: number; value?: number } | number>,
  key: string,
): number | null {
  const entry = tasas[key];
  if (entry == null) return null;
  if (typeof entry === "number") return entry;
  return entry.median ?? entry.value ?? null;
}

export async function fetchElToqueRates(
  apiKey = process.env.EL_TOQUE_API_KEY ?? process.env.EL_TOQUE_API_TOKEN,
): Promise<ElToqueRates> {
  if (!apiKey) {
    throw new Error("EL_TOQUE_API_KEY is required");
  }

  const now = new Date();
  const from = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const url = new URL("https://tasas.eltoque.com/v1/trmi");
  url.searchParams.set("date_from", fmt(from));
  url.searchParams.set("date_to", fmt(now));

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`El Toque API ${res.status}: ${await res.text()}`);
  }

  const body = (await res.json()) as TrmiResponse;
  const tasas = body.tasas ?? body.data ?? {};

  return {
    date: fmt(now),
    usdCup: pickRate(tasas as Record<string, never>, "USD"),
    eurCup: pickRate(tasas as Record<string, never>, "EUR"),
    mlcCup: pickRate(tasas as Record<string, never>, "MLC"),
  };
}

export function convertToUsdEur(
  amount: number,
  currency: string,
  rates: ElToqueRates,
): { usd: number | null; eur: number | null } {
  const { usdCup, eurCup, mlcCup } = rates;
  let cup: number | null = null;

  switch (currency.toUpperCase()) {
    case "USD":
      return { usd: amount, eur: usdCup && eurCup ? (amount * usdCup) / eurCup : null };
    case "EUR":
      return { eur: amount, usd: usdCup && eurCup ? (amount * eurCup) / usdCup : null };
    case "CUP":
      cup = amount;
      break;
    case "MLC":
      cup = mlcCup ? amount * mlcCup : null;
      break;
    default:
      return { usd: null, eur: null };
  }

  return {
    usd: cup != null && usdCup ? cup / usdCup : null,
    eur: cup != null && eurCup ? cup / eurCup : null,
  };
}
