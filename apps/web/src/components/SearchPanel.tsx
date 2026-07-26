"use client";

import { PROVINCES } from "@ofertas-cuba/shared";
import { useProvince } from "@/components/ProvinceGate";
import { useCallback, useEffect, useState } from "react";

interface OfferRow {
  id: string;
  productKey: string;
  rawText: string;
  priceOriginal: string | null;
  currency: string | null;
  priceUsd: string | null;
  priceEur: string | null;
  phone: string | null;
  fbPostUrl: string | null;
  telegramMessageUrl: string | null;
  sourcePlatform: string;
  scrapedAt: string;
}

export function SearchPanel() {
  const { province } = useProvince();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q")?.trim();
    if (q) setQuery(q);
  }, []);

  const runSearch = useCallback(
    async (term: string) => {
      if (!term.trim()) return;
      setLoading(true);
      setMessage(null);
      try {
        const params = new URLSearchParams({ q: term });
        if (province?.id) params.set("provincia", province.id);
        const res = await fetch(`/api/offers/search?${params}`);
        const data = await res.json();
        if (data.message) setMessage(data.message);
        setOffers(data.offers ?? []);
        if (!data.offers?.length && !data.message) {
          setMessage(
            "Sin resultados para esa busqueda. Prueba otro termino o revisa mas tarde.",
          );
        }
      } catch {
        setMessage("Error de busqueda");
      } finally {
        setLoading(false);
      }
    },
    [province?.id],
  );

  const search = useCallback(async () => {
    await runSearch(query);
  }, [query, runSearch]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q")?.trim();
    if (!q) return;
    void runSearch(q);
  }, [province?.id, runSearch]);

  return (
    <section className="card" style={{ marginBottom: "1rem" }}>
      <h2>Buscar ofertas</h2>
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
        <input
          type="search"
          placeholder="Ej: iphone, arroz, laptop..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          style={{
            flex: 1,
            padding: "0.65rem",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--text)",
          }}
        />
        <button type="button" className="primary" onClick={search} disabled={loading}>
          {loading ? "..." : "Buscar"}
        </button>
      </div>

      {message && (
        <p style={{ color: "var(--muted)", marginTop: "1rem" }}>{message}</p>
      )}

      <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
        {offers.map((o) => (
          <li
            key={o.id}
            style={{
              borderTop: "1px solid var(--border)",
              padding: "0.75rem 0",
            }}
          >
            <strong>{o.productKey.slice(0, 80)}</strong>
            <div style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
              {o.priceOriginal && o.currency
                ? `${o.priceOriginal} ${o.currency}`
                : "Precio no detectado"}
              {o.priceUsd ? ` · ~${Number(o.priceUsd).toFixed(0)} USD` : ""}
              {o.priceEur ? ` · ~${Number(o.priceEur).toFixed(0)} EUR` : ""}
            </div>
            <div style={{ marginTop: "0.35rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {o.fbPostUrl && (
                <a href={o.fbPostUrl} target="_blank" rel="noreferrer">
                  Facebook
                </a>
              )}
              {o.telegramMessageUrl && (
                <a href={o.telegramMessageUrl} target="_blank" rel="noreferrer">
                  Telegram
                </a>
              )}
              {o.phone && (
                <a href={`https://wa.me/${o.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              )}
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  color: "#f87171",
                  cursor: "pointer",
                  padding: 0,
                }}
                onClick={async () => {
                  await fetch(`/api/offers/${o.id}/report`, { method: "POST" });
                  setOffers((prev) => prev.filter((x) => x.id !== o.id));
                }}
              >
                Reportar
              </button>
            </div>
          </li>
        ))}
      </ul>

      <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "1rem" }}>
        Bot: @Ofertas_Cuba_bot · Fuente: {PROVINCES.length} provincias
      </p>
    </section>
  );
}
