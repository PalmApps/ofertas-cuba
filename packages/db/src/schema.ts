import {
  bigint,
  boolean,
  date,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const provinces = pgTable("provinces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  platform: text("platform").notNull(),
  externalId: text("external_id").notNull(),
  name: text("name").notNull(),
  provinceId: text("province_id").references(() => provinces.id),
  status: text("status").notNull().default("active"),
  memberCount: numeric("member_count"),
  lastScrapedAt: timestamp("last_scraped_at", { withTimezone: true }),
});

export const offers = pgTable("offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").references(() => groups.id),
  source: text("source").notNull(),
  sourcePlatform: text("source_platform").notNull(),
  rawText: text("raw_text").notNull(),
  productKey: text("product_key").notNull(),
  priceOriginal: numeric("price_original"),
  currency: text("currency"),
  priceUsd: numeric("price_usd"),
  priceEur: numeric("price_eur"),
  phone: text("phone"),
  fbPostUrl: text("fb_post_url"),
  telegramMessageUrl: text("telegram_message_url"),
  sourceChannelName: text("source_channel_name"),
  provinceId: text("province_id").references(() => provinces.id),
  scrapedAt: timestamp("scraped_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isReported: boolean("is_reported").notNull().default(false),
});

export const fxRates = pgTable("fx_rates", {
  date: date("date").primaryKey(),
  ratesJson: jsonb("rates_json").notNull(),
  source: text("source").notNull().default("eltoque"),
});

export const telegramUsers = pgTable("telegram_users", {
  chatId: bigint("chat_id", { mode: "number" }).primaryKey(),
  provinceId: text("province_id").references(() => provinces.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: bigint("chat_id", { mode: "number" })
    .notNull()
    .references(() => telegramUsers.chatId),
  query: text("query").notNull(),
  provinceId: text("province_id").references(() => provinces.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  offerId: uuid("offer_id")
    .notNull()
    .references(() => offers.id),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
