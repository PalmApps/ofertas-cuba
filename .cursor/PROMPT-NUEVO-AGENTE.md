# Copiar y pegar al iniciar nuevo Cloud Agent

```
Repo: PalmApps/ofertas-cuba (monorepo OfertasCuba, PalmApps).

Lee primero:
- AGENTS.md
- docs/HANDOFF.md
- .cursor/rules/*.mdc

CONTEXTO: Comparador de ofertas compra/venta en Cuba (Facebook + Telegram).
Web PWA + bot @Ofertas_Cuba_bot + scrapers GH Actions + Neon + El Toque FX.

URGENTE — El repo ofertas-cuba puede estar VACÍO. El código está en:
https://github.com/PalmApps/palmapps-notify/tree/ofertas-cuba-main

Haz push a main de ofertas-cuba:
  git clone --branch ofertas-cuba-main https://github.com/PalmApps/palmapps-notify.git .
  git remote set-url origin https://github.com/PalmApps/ofertas-cuba.git
  git push -u origin HEAD:main

Luego continúa Fase 1:
1. Neon (DATABASE_URL) + pnpm db:push + db:seed
2. Vercel apps/web + secrets
3. Webhook bot (no polling) para 24/7
4. Scraper Telegram operativo
5. Topic foro via palmapps-notify setup-forum.ps1

REGLAS:
- NO mezclar @PalmAppsNotify_bot (foro CI) con @Ofertas_Cuba_bot (producto)
- NO commitear tokens
- Código solo en ofertas-cuba, NO en palmapps-notify (excepto apps.json catálogo)
- Copy público: "novedades", no "release"

Trabaja autónomamente. Pregunta solo si faltan secrets que no puedas configurar.
```
