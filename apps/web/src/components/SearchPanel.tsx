"use client";

import { PROVINCES } from "@ofertas-cuba/shared";
import { useProvince } from "@/components/ProvinceGate";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  provinceId: string | null;
  scrapedAt: string;
}

type ScopeMode = "home" | "all" | "custom";

function provinceLabel(id: string | null): string {
  if (!id) return "Sin provincia";
  return PROVINCES.find((p) => p.id === id)?.name ?? id;
}

export function SearchPanel() {
  const { province } = useProvince();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [scope, setScope] = useState<ScopeMode>("home");
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q")?.trim();
    if (q) setQuery(q);

    const prov = params.get("provincia");
    if (prov === "*" || prov === "todas") {
      setScope("all");
    } else if (prov?.includes(",")) {
      setScope("custom");
      setPicked(prov.split(",").map((s) => s.trim()).filter(Boolean));
    }
  }, []);

  const scopeSummary = useMemo(() => {
    if (scope === "all") return "Toda Cuba";
    if (scope === "custom") {
      if (picked.length === 0) return "Elige al menos una provincia";
      if (picked.length <= 3) {
        return picked.map((id) => provinceLabel(id)).join(", ");
      }
      return `${picked.length} provincias`;
    }
    return province?.name ?? "Mi provincia";
  }, [scope, picked, province?.name]);

  const buildProvinciaParam = useCallback((): string | null => {
    if (scope === "all") return null;
    if (scope === "custom") {
      if (picked.length === 0) return province?.id ?? null;
      return picked.join(",");
    }
    return province?.id ?? null;
  }, [scope, picked, province?.id]);

  const runSearch = useCallback(
    async (term: string) => {
      if (!term.trim()) return;
      setLoading(true);
      setMessage(null);
      try {
        const params = new URLSearchParams({ q: term });
        const provincia = buildProvinciaParam();
        if (provincia) params.set("provincia", provincia);
        else params.set("provincia", "todas");

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
    [buildProvinciaParam],
  );

  const search = useCallback(async () => {
    await runSearch(query);
  }, [query, runSearch]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q")?.trim();
    if (!q) return;
    void runSearch(q);
  }, [scope, picked, province?.id, runSearch]);

  const toggleProvince = (id: string) => {
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <section className="card" style={{ marginBottom: "1rem" }}>
      <h2>Buscar ofertas</h2>

      <div style={{ marginTop: "0.75rem" }}>
        <label htmlFor="scope" style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
          Donde buscar
        </label>
        <select
          id="scope"
          value={scope}
          onChange={(e) => setScope(e.target.value as ScopeMode)}
          style={{
            display: "block",
            width: "100%",
            marginTop: "0.35rem",
            padding: "0.55rem",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--text)",
          }}
        >
          <option value="home">
            Mi provincia{province ? ` (${province.name})` : ""}
          </option>
          <option value="all">Toda Cuba</option>
          <option value="custom">Varias provincias…</option>
        </select>
        <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.35rem" }}>
          Filtro: {scopeSummary}
        </p>
      </div>

      {scope === "custom" && (
        <div
          style={{
            marginTop: "0.5rem",
            maxHeight: 140,
            overflowY: "auto",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "0.5rem",
          }}
        >
          {PROVINCES.map((p) => (
            <label
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.2rem 0",
                fontSize: "0.9rem",
              }}
            >
              <input
                type="checkbox"
                checked={picked.includes(p.id)}
                onChange={() => toggleProvince(p.id)}
              />
              {p.name}
            </label>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
        <input
          type="search"
          placeholder="Ej: revolico ssp, arroz, iphone..."
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
              {o.provinceId ? ` · ${provinceLabel(o.provinceId)}` : ""}
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
