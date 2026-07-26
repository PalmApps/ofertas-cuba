#!/usr/bin/env node
/**
 * Sincroniza secrets desde .env local a GitHub Actions (repo u org).
 *
 * Uso:
 *   pnpm secrets:sync
 *   pnpm secrets:sync -- --file .env.local
 *   pnpm secrets:sync -- --org PalmApps
 *
 * Requisito: gh auth login (gh secret set)
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const DEFAULT_KEYS = [
  "DATABASE_URL",
  "EL_TOQUE_API_KEY",
  "TELEGRAM_OFERTAS_BOT_TOKEN",
  "TELEGRAM_BOT_WEBHOOK_SECRET",
  "TELEGRAM_API_ID",
  "TELEGRAM_API_HASH",
  "TELEGRAM_USER_SESSION",
  "FB_SESSION_COOKIE",
  "FB_SCRAPE_USER_AGENT",
];

const REPO = "PalmApps/ofertas-cuba";

function parseArgs(argv) {
  let file = ".env";
  let org = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--file" && argv[i + 1]) {
      file = argv[++i];
    } else if (argv[i] === "--org" && argv[i + 1]) {
      org = argv[++i];
    } else if (argv[i] === "--help" || argv[i] === "-h") {
      console.log(`Uso: pnpm secrets:sync [-- --file .env] [--org PalmApps]`);
      process.exit(0);
    }
  }
  return { file, org };
}

function loadEnvFile(path) {
  if (!existsSync(path)) {
    console.error(`No existe ${path}. Copia .env.example → .env y rellena valores.`);
    process.exit(1);
  }

  const vars = new Map();
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value) vars.set(key, value);
  }
  return vars;
}

function ghSecretSet(key, value, org) {
  const args = ["secret", "set", key, "--body", value];
  if (org) {
    args.push("--org", org);
  } else {
    args.push("--repo", REPO);
  }

  const result = spawnSync("gh", args, { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(`Error en ${key}:`, result.stderr || result.stdout);
    return false;
  }
  return true;
}

function main() {
  const { file, org } = parseArgs(process.argv.slice(2));
  const envPath = resolve(process.cwd(), file);
  const vars = loadEnvFile(envPath);
  const target = org ? `org ${org}` : `repo ${REPO}`;

  console.log(`Sincronizando secrets → GitHub (${target}) desde ${file}\n`);

  let ok = 0;
  let skipped = 0;

  for (const key of DEFAULT_KEYS) {
    const value = vars.get(key);
    if (!value) {
      console.log(`  omitido  ${key} (vacío en .env)`);
      skipped++;
      continue;
    }
    process.stdout.write(`  subiendo ${key}... `);
    if (ghSecretSet(key, value, org)) {
      console.log("ok");
      ok++;
    } else {
      console.log("FALLÓ");
      process.exit(1);
    }
  }

  console.log(`\nListo: ${ok} secrets actualizados, ${skipped} omitidos.`);
  console.log("Vuelve a Actions → Scrape Telegram channels → Run workflow.");
}

main();
