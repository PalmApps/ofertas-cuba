import { loadJson, parseOfferText, persistOffers } from "../lib.js";

interface FacebookGroupSeed {
  name: string;
  url: string;
  provinceId: string | null;
  notes?: string;
}

/**
 * Fase 1 pendiente: requiere cookies de sesion FB + URLs reales en seeds.
 *
 * Secrets GitHub:
 * - FB_SESSION_COOKIE (c_user=...; xs=...; datr=... desde navegador logueado)
 * - FB_SCRAPE_USER_AGENT (opcional)
 *
 * Pasos manuales:
 * 1. Editar docs/seeds/facebook-groups.json con URLs de grupos publicos reales
 * 2. Cuenta FB dedicada → DevTools → Application → Cookies → facebook.com
 * 3. Copiar cadena completa a secret FB_SESSION_COOKIE
 * 4. Implementar fetch/Playwright del feed del grupo (mobile web)
 */
export async function runFacebookScraper(): Promise<void> {
  const groups = loadJson<FacebookGroupSeed[]>("facebook-groups.json").filter(
    (g) => !g.url.includes("ejemplo"),
  );
  console.log(`Facebook scraper — ${groups.length} grupos semilla`);

  const sessionCookie = process.env.FB_SESSION_COOKIE?.trim();
  if (!sessionCookie) {
    console.error(
      "Falta FB_SESSION_COOKIE en secrets.",
      "Ver docs/SETUP.md seccion Facebook y facebook/run.ts",
    );
    process.exit(1);
  }

  if (groups.length === 0) {
    console.error(
      "No hay grupos reales en docs/seeds/facebook-groups.json",
      "(solo placeholders ejemplo-*).",
    );
    process.exit(1);
  }

  console.warn(
    "Scraper Facebook aun no implementado (stub).",
    "Grupos configurados:",
    groups.map((g) => g.name).join(", "),
  );
  console.warn(
    "Proximo paso: Playwright con FB_SESSION_COOKIE para leer posts publicos.",
  );

  await persistOffers([]);
  console.log("Facebook scrape complete (sin ofertas — implementacion pendiente).");
}

runFacebookScraper().catch((err) => {
  console.error(err);
  process.exit(1);
});
