import { Bot, webhookCallback } from "grammy";
import { createBot, registerBotCommands } from "@ofertas-cuba/bot/bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let bot: Bot | null = null;
let commandsRegistered = false;

function getBot(): Bot {
  const token = process.env.TELEGRAM_OFERTAS_BOT_TOKEN;
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
  const webhookSecret = process.env.TELEGRAM_BOT_WEBHOOK_SECRET;
  if (webhookSecret) {
    const header = request.headers.get("x-telegram-bot-api-secret-token");
    if (header !== webhookSecret) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  await ensureCommands();
  const handleUpdate = webhookCallback(getBot(), "std/http");
  return handleUpdate(request);
}

export async function GET(): Promise<Response> {
  const configured = Boolean(process.env.TELEGRAM_OFERTAS_BOT_TOKEN);
  return Response.json({
    ok: configured,
    bot: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "Ofertas_Cuba_bot",
    mode: "webhook",
  });
}
