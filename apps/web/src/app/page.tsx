"use client";

import { SearchPanel } from "@/components/SearchPanel";
import { useProvince } from "@/components/ProvinceGate";

export default function HomePage() {
  const { province } = useProvince();

  return (
    <main>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1>OfertasCuba</h1>
        <p>
          Provincia: <strong>{province?.name}</strong>{" "}
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("ofertas-cuba-province");
              window.location.reload();
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--accent)",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            cambiar
          </button>
        </p>
      </header>

      <SearchPanel />

      <p className="disclaimer">
        Precios del mercado informal (Facebook + Telegram). Referencia USD/EUR
        via El Toque. Verifica siempre antes de pagar.
      </p>
    </main>
  );
}
