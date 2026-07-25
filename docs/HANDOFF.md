# Handoff — OfertasCuba (nuevo Cloud Agent)

Documento para continuar el proyecto sin perder contexto. Última actualización: jul 2026.

---

## Prompt para pegar en el nuevo agente

```
Continúa OfertasCuba (PalmApps). Lee AGENTS.md, docs/HANDOFF.md y .cursor/rules/.

PRIORIDAD 1: Publicar código en https://github.com/PalmApps/ofertas-cuba
- El repo puede estar vacío. Código en rama ofertas-cuba-main de palmapps-notify:
  git clone --branch ofertas-cuba-main https://github.com/PalmApps/palmapps-notify.git /tmp/oc
  cd /tmp/oc && git remote add origin https://github.com/PalmApps/ofertas-cuba.git
  git push -u origin HEAD:main

PRIORIDAD 2: Neon + secrets + Vercel (apps/web)
PRIORIDAD 3: Bot webhook @Ofertas_Cuba_bot en Vercel
PRIORIDAD 4: Scraper Telegram operativo (GH Actions)

No mezclar @PalmAppsNotify_bot con el bot producto.
No commitear tokens. Repo de la app es ofertas-cuba, NO palmapps-notify.
```

---

## Qué es el producto

**OfertasCuba** = comparador de ofertas compra/venta en Cuba (estilo Idealo adaptado).

- Fuentes: grupos públicos **Facebook** + canales/grupos **Telegram** + reenvíos usuarios al bot
- Web PWA: provincia, búsqueda, comparar precios USD/EUR (El Toque)
- Bot: `@Ofertas_Cuba_bot` — búsqueda, alertas, reenvío ofertas
- DB: Neon Postgres (Drizzle)
- Scrapers: GitHub Actions cron

---

## Decisiones de diseño (3 rondas de planificación)

| # | Tema | Decisión |
|---|------|----------|
| 1 | Usuario | Comprador primero; vendedores fase 3 |
| 2 | Cobertura | Toda Cuba + filtro provincia |
| 3 | Categorías | Todas |
| 4 | Datos | Scraping FB + TG + crowdsourcing bot |
| 5 | Canales | Web PWA + Telegram |
| 6 | FX | USD/EUR referencia (El Toque API) |
| 7 | Marca | PalmApps, comunidad primero |
| 8 | Equipo | Un dev dedicado |
| 9 | Cuentas | Sin registro fase 1 |
| 10 | Bot fase 1 | Búsqueda + alertas + reenvío |
| 11 | Scraping | Conservador → moderado |
| 12 | Grupos | Descubrimiento auto keywords |
| 13 | Confianza MVP | Básico; señales fase 2 |
| 14 | Contacto | FB + WhatsApp |
| 15 | FX source | El Toque (key en Costify org) |
| 16 | Nombre | OfertasCuba |
| 17 | Éxito | Cobertura + alertas + feedback foro |
| 18 | Monetización futura | Destacar → analytics → publicación directa |
| 19 | Scraper host | GitHub Actions |
| 20 | Repo | Monorepo `apps/*` + `packages/*` |
| 21 | Dominio | ofertascuba.vercel.app → ofertas.palmapps.com |
| 22 | Bot | `@Ofertas_Cuba_bot` (NUEVO, no Notify) |
| 23 | Moderación | Auto permisivo |
| 24 | Contenido | Blacklist + reportar |
| 25 | i18n | ES ahora, estructura EN |
| 26 | DB | Neon |
| 27 | Beta | Cuando web+bot funcionen |
| 28 | Código | Repo privado → ahora **público** |

---

## Estructura del monorepo

```
apps/web/                 Next.js 15 — Vercel root apps/web
  src/app/api/offers/     search, report
  src/app/api/fx/         El Toque
  src/components/         ProvinceGate, SearchPanel

apps/bot/                 Grammy — polling dev, webhook prod pendiente
  src/store.ts            memoria (migrar a Neon)

apps/scraper/
  src/facebook/run.ts     stub
  src/telegram/run.ts     GramJS/Telethon-style (telegram pkg)
  src/lib.ts              parse + persist

packages/shared/          provincias, blacklist, parser, eltoque.ts
packages/db/              Drizzle schema, searchOffers, insertOffer
```

---

## Estado actual del código

| Componente | Estado |
|------------|--------|
| Monorepo local | ✅ Commits en rama `ofertas-cuba-main` (palmapps-notify) |
| Repo `PalmApps/ofertas-cuba` | ⚠️ Puede estar **vacío** — push pendiente |
| Web build | ✅ `pnpm --filter @ofertas-cuba/web build` |
| Bot funcional | ✅ Comandos + provincia inline (memoria) |
| DB schema Drizzle | ✅ `packages/db` — falta Neon real |
| El Toque client | ✅ `packages/shared/src/eltoque.ts` |
| Scrapers | ⚠️ Stub/dry-run |
| Foro topic | ❌ Pendiente setup-forum.ps1 |
| Vercel | ❌ Pendiente import |
| palmapps-notify PR #1 | Solo catálogo apps.json — merge OK independiente |

---

## Problema conocido: permisos Cloud Agent

Sesiones iniciadas **antes** de actualizar permisos Cursor en PalmApps org usan token `cursor[bot]` sin write en `ofertas-cuba`.

**Solución:** nuevo Cloud Agent tras dar Write a Cursor en "All repositories".

Workflow puente en palmapps-notify: `.github/workflows/publish-ofertas-cuba.yml` (push a rama `ofertas-cuba-main` debería dispararlo).

---

## Secrets necesarios (repo ofertas-cuba)

| Secret | Notas |
|--------|-------|
| `DATABASE_URL` | Neon connection string |
| `EL_TOQUE_API_KEY` | Misma org que Costify |
| `TELEGRAM_OFERTAS_BOT_TOKEN` | `@Ofertas_Cuba_bot` — **revocar si se expuso en chat** |
| `TELEGRAM_API_ID` | my.telegram.org |
| `TELEGRAM_API_HASH` | my.telegram.org |
| `TELEGRAM_USER_SESSION` | `pnpm --filter @ofertas-cuba/scraper auth:telegram` |

Para CI foro (palmapps-notify action): `TELEGRAM_BOT_TOKEN` + `TELEGRAM_FORUM_CHAT_ID` (org).

---

## Checklist Fase 1 (orden sugerido)

- [ ] Push `main` a `PalmApps/ofertas-cuba`
- [ ] Crear Neon + `DATABASE_URL` en secrets y Vercel
- [ ] `pnpm db:push && pnpm db:seed`
- [ ] Import Vercel (root `apps/web`)
- [ ] Secrets en repo + Vercel env vars
- [ ] Webhook bot: `apps/web/src/app/api/telegram/route.ts` (crear)
- [ ] Migrar bot store a Neon (`telegram_users`, `alerts`)
- [ ] Scraper TG: sesión + grupos semilla reales
- [ ] Scraper FB: implementación básica
- [ ] `setup-forum.ps1` → topic OfertasCuba
- [ ] Beta anuncio en foro `@palmapps`
- [ ] Mejorar `extractPrice` (bug: "iPhone 13" → precio 13)

---

## Comandos

```bash
pnpm install
pnpm dev
pnpm dev:bot
pnpm typecheck
pnpm build
pnpm db:push
pnpm db:seed
pnpm scrape:telegram
pnpm scrape:facebook
```

## Enlaces

- Repo app: https://github.com/PalmApps/ofertas-cuba
- Rama puente: https://github.com/PalmApps/palmapps-notify/tree/ofertas-cuba-main
- PR catálogo: https://github.com/PalmApps/palmapps-notify/pull/1
- Bot: https://t.me/Ofertas_Cuba_bot
- Foro: https://t.me/palmapps
