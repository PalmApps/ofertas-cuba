import { Bot, webhookCallback } from "grammy";
import { env } from "@ofertas-cuba/shared";
import { createBot, registerBotCommands } from "@ofertas-cuba/bot/bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let bot: Bot | null = null;
let commandsRegistered = false;

function getBot(): Bot {
  const token = env("TELEGRAM_OFERTAS_BOT_TOKEN");
  if (!token) {
    throw new Error("TELEGRAM_OFERTAS_BOT_TOKEN is required");
  }

  if (!bot) {
    bot = createBot(token);
  }

  return bot;
}

async function ensureCommands(): Promise<void> {
  if (commandsRegistered) return;
  await registerBotCommands(getBot());
  commandsRegistered = true;
}

export async function POST(request: Request): Promise<Response> {
  try {
    await ensureCommands();
  } catch (err) {
    console.error("registerBotCommands failed:", err);
  }

  try {
    const handleUpdate = webhookCallback(getBot(), "std/http");
    return await handleUpdate(request);
  } catch (err) {
    console.error("telegram webhook error:", err);
    return new Response("Error", { status: 500 });
  }
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const sync = searchParams.get("sync") === "1";
  const token = env("TELEGRAM_OFERTAS_BOT_TOKEN");
  const appUrl = env("NEXT_PUBLIC_APP_URL") ?? "https://ofertascuba.vercel.app";

  if (sync && token) {
    const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/telegram`;
    const body: Record<string, unknown> = {
      url: webhookUrl,
      allowed_updates: ["message", "callback_query", "channel_post"],
      drop_pending_updates: true,
    };
    const secret = env("TELEGRAM_BOT_WEBHOOK_SECRET");
    if (secret) body.secret_token = secret;

    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { ok: boolean; description?: string };
    return Response.json({ ok: data.ok, webhook: webhookUrl, detail: data.description });
  }

  return Response.json({
    ok: Boolean(token),
    bot: env("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME") ?? "Ofertas_Cuba_bot",
    mode: "webhook",
    webhookSecret: Boolean(env("TELEGRAM_BOT_WEBHOOK_SECRET")),
  });
}
