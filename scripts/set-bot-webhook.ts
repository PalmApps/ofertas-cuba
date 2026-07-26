#!/usr/bin/env node
/**
 * Registra webhook del bot @Ofertas_Cuba_bot en Vercel.
 * Uso: pnpm bot:webhook:set
 */
import { env } from "@ofertas-cuba/shared";
import { loadEnv } from "../apps/bot/src/load-env.js";

loadEnv();

const token = env("TELEGRAM_OFERTAS_BOT_TOKEN");
const appUrl = env("NEXT_PUBLIC_APP_URL") ?? "https://ofertascuba.vercel.app";
const useSecret = env("TELEGRAM_BOT_WEBHOOK_SECRET");

if (!token) {
  console.error("TELEGRAM_OFERTAS_BOT_TOKEN is required");
  process.exit(1);
}

const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/telegram`;

async function main(): Promise<void> {
  const body: Record<string, unknown> = {
    url: webhookUrl,
    allowed_updates: ["message", "callback_query", "channel_post"],
    drop_pending_updates: true,
  };

  if (useSecret) {
    body.secret_token = useSecret;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as { ok: boolean; description?: string };

  if (!data.ok) {
    console.error("setWebhook failed:", data.description);
    process.exit(1);
  }

  const info = (await fetch(
    `https://api.telegram.org/bot${token}/getWebhookInfo`,
  ).then((r) => r.json())) as { result?: { url?: string; last_error_message?: string } };

  console.log("Webhook registrado:", info.result?.url ?? webhookUrl);
  if (info.result?.last_error_message) {
    console.warn("Ultimo error Telegram:", info.result.last_error_message);
  }
  if (useSecret) {
    console.log("Webhook secret activo (TELEGRAM_BOT_WEBHOOK_SECRET)");
  } else {
    console.log("Sin webhook secret (recomendado si hubo errores 401)");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
