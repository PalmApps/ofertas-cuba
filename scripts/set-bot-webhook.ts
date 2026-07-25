#!/usr/bin/env node
/**
 * Registra webhook del bot @Ofertas_Cuba_bot en Vercel.
 * Uso: pnpm bot:webhook:set
 */
import { loadEnv } from "../../bot/src/load-env.js";

loadEnv();

const token = process.env.TELEGRAM_OFERTAS_BOT_TOKEN;
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ofertascuba.vercel.app";
const secret = process.env.TELEGRAM_BOT_WEBHOOK_SECRET ?? crypto.randomUUID();

if (!token) {
  console.error("TELEGRAM_OFERTAS_BOT_TOKEN is required");
  process.exit(1);
}

const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/telegram`;

async function main(): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: true,
    }),
  });

  const data = (await res.json()) as { ok: boolean; description?: string };

  if (!data.ok) {
    console.error("setWebhook failed:", data.description);
    process.exit(1);
  }

  console.log("Webhook registrado:", webhookUrl);
  console.log("TELEGRAM_BOT_WEBHOOK_SECRET=", secret);
  console.log("Guarda el secret en Vercel y GitHub (no commitear).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
