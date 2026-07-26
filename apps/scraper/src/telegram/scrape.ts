import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { loadJson, persistOffers } from "../lib";
import {
  channelSearchTags,
  inferProvinceFromText,
  looksLikeOffer,
  parseOfferText,
  resolveOfferProvinceId,
} from "@ofertas-cuba/shared";
import type { Entity } from "telegram/define.js";

interface TelegramChannelSeed {
  username: string;
  name: string;
  provinceId: string | null;
  type: "channel" | "group";
  notes?: string;
}

const SKIP_USERNAMES = new Set<string>();
const DEFAULT_MESSAGE_LIMIT = 100;
const SSP_MESSAGE_LIMIT = 150;

function sortChannelsForScrape(
  channels: TelegramChannelSeed[],
): TelegramChannelSeed[] {
  const rank = (c: TelegramChannelSeed): number => {
    if (c.provinceId === "ssp") return 0;
    if (c.provinceId == null) return 1;
    return 2;
  };
  return [...channels].sort((a, b) => rank(a) - rank(b));
}

function messageLimitForChannel(channel: TelegramChannelSeed): number {
  return channel.provinceId === "ssp" ? SSP_MESSAGE_LIMIT : DEFAULT_MESSAGE_LIMIT;
}

function messageUrl(username: string, messageId: number): string {
  return `https://t.me/${username}/${messageId}`;
}

function channelLabels(seed: TelegramChannelSeed, entity: Entity): string {
  const parts = [seed.name];
  if ("title" in entity && typeof entity.title === "string" && entity.title) {
    parts.push(entity.title);
  }
  if ("username" in entity && typeof entity.username === "string" && entity.username) {
    parts.push(entity.username);
  }
  return parts.join(" · ");
}

function resolveChannelProvinceId(
  seed: TelegramChannelSeed,
  entity: Entity,
): string | null {
  if (seed.provinceId) return seed.provinceId;
  return inferProvinceFromText(channelLabels(seed, entity))?.id ?? null;
}

function requireTelegramEnv(): {
  apiId: number;
  apiHash: string;
  session: string;
} {
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH?.trim();
  const session = process.env.TELEGRAM_USER_SESSION?.trim();

  if (!apiId || !apiHash || !session) {
    throw new Error(
      "Faltan TELEGRAM_API_ID, TELEGRAM_API_HASH o TELEGRAM_USER_SESSION en variables de entorno.",
    );
  }

  return { apiId, apiHash, session };
}

/** Lee mensajes recientes de canales/grupos publicos semilla. */
export async function runTelegramScraper(): Promise<{ offers: number; channels: number }> {
  const channels = sortChannelsForScrape(
    loadJson<TelegramChannelSeed[]>("telegram-channels.json").filter(
      (c) => !SKIP_USERNAMES.has(c.username) && !c.username.startsWith("ejemplo"),
    ),
  );

  if (channels.length === 0) {
    return { offers: 0, channels: 0 };
  }

  const { apiId, apiHash, session } = requireTelegramEnv();

  const client = new TelegramClient(
    new StringSession(session),
    apiId,
    apiHash,
    { connectionRetries: 3 },
  );

  await client.connect();

  const allOffers = [];

  for (const channel of channels.slice(0, 25)) {
    try {
      const entity = await client.getEntity(channel.username);
      const provinceId = resolveChannelProvinceId(channel, entity);
      const messages = await client.getMessages(entity, {
        limit: messageLimitForChannel(channel),
      });

      for (const msg of messages) {
        const text = msg.message?.trim();
        if (!text) continue;

        const parsed = parseOfferText(text, {
          sourcePlatform: "telegram",
          sourceUrl: messageUrl(channel.username, msg.id),
          externalGroupId: channel.username,
        });

        if (parsed && looksLikeOffer(text)) {
          parsed.provinceId = resolveOfferProvinceId(text, provinceId);
          parsed.sourceChannelName = channelLabels(channel, entity);
          const tags = channelSearchTags(
            channelLabels(channel, entity),
            channel.username,
          );
          parsed.productKey = `${parsed.productKey} ${tags}`.trim().slice(0, 200);
          allOffers.push(parsed);
        }
      }
    } catch (err) {
      console.warn(`Skip ${channel.username}:`, err);
    }
  }

  await client.disconnect();
  await persistOffers(allOffers);

  return { offers: allOffers.length, channels: channels.length };
}
