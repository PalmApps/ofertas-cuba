import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { loadJson, persistOffers } from "../lib.js";
import { looksLikeOffer, parseOfferText } from "@ofertas-cuba/shared";

interface TelegramChannelSeed {
  username: string;
  name: string;
  provinceId: string | null;
  type: "channel" | "group";
  notes?: string;
}

const SKIP_USERNAMES = new Set<string>();

function messageUrl(username: string, messageId: number): string {
  return `https://t.me/${username}/${messageId}`;
}

/**
 * Lee mensajes recientes de canales/grupos publicos semilla.
 */
export async function runTelegramScraper(): Promise<void> {
  const channels = loadJson<TelegramChannelSeed[]>("telegram-channels.json").filter(
    (c) => !SKIP_USERNAMES.has(c.username) && !c.username.startsWith("ejemplo"),
  );
  console.log(`Telegram scraper — ${channels.length} fuentes activas`);

  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH;
  const session = process.env.TELEGRAM_USER_SESSION;

  if (!apiId || !apiHash || !session) {
    console.error(
      "Faltan TELEGRAM_API_ID, TELEGRAM_API_HASH o TELEGRAM_USER_SESSION.",
      "Genera sesion: pnpm --filter @ofertas-cuba/scraper auth:telegram",
    );
    process.exit(1);
  }

  if (channels.length === 0) {
    console.warn("No hay canales semilla reales en docs/seeds/telegram-channels.json");
    return;
  }

  const client = new TelegramClient(
    new StringSession(session),
    apiId,
    apiHash,
    { connectionRetries: 3 },
  );

  await client.connect();
  console.log("Telegram client connected.");

  const allOffers = [];

  for (const channel of channels.slice(0, 10)) {
    try {
      const entity = await client.getEntity(channel.username);
      const messages = await client.getMessages(entity, { limit: 50 });
      console.log(`OK: ${channel.name} — ${messages.length} mensajes`);

      for (const msg of messages) {
        const text = msg.message?.trim();
        if (!text) continue;

        const parsed = parseOfferText(text, {
          sourcePlatform: "telegram",
          sourceUrl: messageUrl(channel.username, msg.id),
          externalGroupId: channel.username,
        });

        if (parsed && looksLikeOffer(text)) {
          parsed.provinceId = channel.provinceId;
          allOffers.push(parsed);
        }
      }
    } catch (err) {
      console.warn(`Skip ${channel.username}:`, err);
    }
  }

  await client.disconnect();
  await persistOffers(allOffers);
  console.log(`Telegram scrape complete — ${allOffers.length} ofertas parseadas`);
}

runTelegramScraper().catch((err) => {
  console.error(err);
  process.exit(1);
});
