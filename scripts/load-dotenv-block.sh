#!/usr/bin/env bash
# Carga variables estilo .env desde un bloque multilínea (GitHub secret).
# Uso en CI: TELEGRAM_SCRAPER_DOTENV="${{ secrets.TELEGRAM_SCRAPER_DOTENV }}" ./scripts/load-dotenv-block.sh
set -euo pipefail

block="${TELEGRAM_SCRAPER_DOTENV:-}"
if [ -z "$block" ]; then
  echo "TELEGRAM_SCRAPER_DOTENV vacío — usando secrets individuales si existen."
  exit 0
fi

while IFS= read -r line || [ -n "$line" ]; do
  line="${line%%#*}"
  line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [ -z "$line" ] && continue
  key="${line%%=*}"
  val="${line#*=}"
  key="$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  val="$(echo "$val" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/^"//;s/"$//')"
  [ -z "$key" ] || [ -z "$val" ] && continue
  echo "${key}=${val}" >> "$GITHUB_ENV"
  echo "  cargado ${key}"
done <<< "$block"
