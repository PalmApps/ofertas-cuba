#!/usr/bin/env bash
# Ejecutar desde la raiz del monorepo ofertas-cuba
set -euo pipefail

REMOTE="${1:-https://github.com/PalmApps/ofertas-cuba.git}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "No es un repo git. Ejecuta desde ofertas-cuba/"
  exit 1
fi

git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE"
git branch -M main
git push -u origin main

echo "OK: pushed to $REMOTE"
