import { env } from "./env";
import { fetchPublicElToqueRates } from "./eltoque-public";

export interface ElToqueRates {
  date: string;
  usdCup: number | null;
  eurCup: number | null;
  mlcCup: number | null;
}

interface TrmiResponse {
  date?: string;
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

function resolveApiKey(): string | undefined {
  return (
    env("EL_TOQUE_API_KEY") ??
    env("ELTOQUE_API_TOKEN") ??
    env("EL_TOQUE_API_TOKEN")
  );
}

export async function fetchElToqueRates(
  apiKey = resolveApiKey(),
): Promise<ElToqueRates> {
  if (apiKey) {
    try {
      return await fetchElToqueRatesApi(apiKey);
    } catch (err) {
      console.warn("El Toque API failed, using public fallback:", err);
    }
  }

  return fetchPublicElToqueRates();
}

async function fetchElToqueRatesApi(apiKey: string): Promise<ElToqueRates> {
  const res = await fetch("https://tasas.eltoque.com/v1/trmi", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      accept: "*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`El Toque API ${res.status}: ${await res.text()}`);
  }

  const body = (await res.json()) as TrmiResponse;
  const tasas = body.tasas ?? body.data ?? {};
  const date =
    body.date ?? new Date().toISOString().slice(0, 10);

  return {
    date,
    usdCup: pickRate(tasas as Record<string, never>, "USD"),
    eurCup:
      pickRate(tasas as Record<string, never>, "ECU") ??
      pickRate(tasas as Record<string, never>, "EUR"),
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
