# Importar codigo al repo vacio

El Cloud Agent no tiene permiso de **push** en `PalmApps/ofertas-cuba` (solo lectura).
El codigo esta en la rama **`ofertas-cuba-main`** de `palmapps-notify`.

## Opcion A — GitHub Codespaces (desde el movil)

1. Abre https://github.com/PalmApps/ofertas-cuba
2. **Code** → **Codespaces** → **Create codespace**
3. En la terminal del codespace:

```bash
git remote add src https://github.com/PalmApps/palmapps-notify.git
git fetch src ofertas-cuba-main
git checkout -B main
git reset --hard src/ofertas-cuba-main
git push -u origin main
```

## Opcion B — PC local

```bash
git clone https://github.com/PalmApps/ofertas-cuba.git
cd ofertas-cuba
git remote add src https://github.com/PalmApps/palmapps-notify.git
git fetch src ofertas-cuba-main
git reset --hard src/ofertas-cuba-main
git push -u origin main
```

## Opcion C — Dar write al agente

Repo **Settings** → **Collaborators** → invitar con permiso **Write** a la integracion de Cursor/GitHub App.

Luego pide al agente que haga `git push` de nuevo.

## Despues del push

1. Secrets en el repo (ver `docs/SETUP.md`)
2. Neon + `pnpm db:push && pnpm db:seed`
3. Vercel import (`apps/web`)
