# AGENTS.md — OfertasCuba / PalmApps

Documento de contexto para agentes de IA. **Confidencial:** no incluir tokens en código ni rules.

## Reglas Cursor (leer antes de editar)

| Rule | Contenido |
|------|-----------|
| `.cursor/rules/ofertas-cuba-context.mdc` | Producto, arquitectura, decisiones, estado |
| `.cursor/rules/palmapps-integration.mdc` | Foro, notify, catálogo, copy público |
| `.cursor/rules/utf8-telegram.mdc` | UTF-8 obligatorio en textos Telegram |
| `docs/HANDOFF.md` | Handoff completo para nuevo agente |
| `docs/PLAN.md` | Plan por fases |
| `docs/SETUP.md` | Secrets, Neon, Vercel, checklist |

## Qué es OfertasCuba

Comparador comunitario de **compra y venta en Cuba**. Indexa ofertas de grupos públicos de **Facebook** y **Telegram**, normaliza precios con referencia **USD/EUR** (El Toque API), filtra por **provincia** y conecta al post original o WhatsApp del vendedor.

- **Marca:** PalmApps
- **Nombre público:** OfertasCuba
- **Key técnica:** `ofertas-cuba`
- **Web MVP:** https://ofertascuba.vercel.app
- **Foro:** https://t.me/palmapps (topic OfertasCuba — pendiente `setup-forum.ps1`)
- **Bot producto:** `@Ofertas_Cuba_bot` (NO es `@PalmAppsNotify_bot`)

## Repo

- **GitHub:** https://github.com/PalmApps/ofertas-cuba
- **Local Windows:** `D:\Devops\Repos\ofertas-cuba`
- **Monorepo pnpm:** `apps/web`, `apps/bot`, `apps/scraper`, `packages/shared`, `packages/db`

## Relación con palmapps-notify

`palmapps-notify` solo tiene **catálogo** (`templates/apps.json` entrada `ofertas-cuba`). El código de la app **no** vive ahí.

Si el repo `ofertas-cuba` está vacío, el código fuente está en la rama puente:
`https://github.com/PalmApps/palmapps-notify/tree/ofertas-cuba-main`

## Comandos útiles

```bash
pnpm install
pnpm dev              # web :3000
pnpm dev:bot          # bot polling (TELEGRAM_OFERTAS_BOT_TOKEN en .env)
pnpm db:push          # Drizzle → Neon
pnpm db:seed          # provincias
pnpm scrape:telegram
pnpm scrape:facebook
pnpm typecheck && pnpm build
```

## Primera tarea del agente nuevo

1. Verificar push a `PalmApps/ofertas-cuba` (repo puede estar vacío)
2. Si vacío: importar desde rama `ofertas-cuba-main` de `palmapps-notify` (ver `docs/IMPORT.md`)
3. Continuar Fase 1: Neon, Vercel, webhook bot, scrapers operativos

Ver `docs/HANDOFF.md` para detalle completo.
