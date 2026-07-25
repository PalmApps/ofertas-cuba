import { env } from "./env";
import type { ElToqueRates } from "./eltoque";

/** Tasas publicadas en eltoque.com cuando no hay API key. */
export async function fetchPublicElToqueRates(): Promise<ElToqueRates> {
  const res = await fetch("https://eltoque.com/", {
    headers: { Accept: "text/html", "User-Agent": "OfertasCuba/0.1" },
  });

  if (!res.ok) {
    throw new Error(`eltoque.com ${res.status}`);
  }

  const html = await res.text();
  const usdMatch = html.match(/1 USD[\s\S]{0,80}?(\d+(?:\.\d+)?)\s*CUP/i);
  const eurMatch = html.match(/1 EUR[\s\S]{0,80}?(\d+(?:\.\d+)?)\s*CUP/i);
  const mlcMatch = html.match(/1 MLC[\s\S]{0,80}?(\d+(?:\.\d+)?)\s*CUP/i);

  const usdCup = usdMatch ? Number.parseFloat(usdMatch[1]) : null;
  const eurCup = eurMatch ? Number.parseFloat(eurMatch[1]) : null;
  const mlcCup = mlcMatch ? Number.parseFloat(mlcMatch[1]) : null;

  if (!usdCup && !eurCup) {
    throw new Error("Could not parse public elTOQUE rates");
  }

  return {
    date: new Date().toISOString().slice(0, 10),
    usdCup,
    eurCup,
    mlcCup,
  };
}
