import { and, eq } from "drizzle-orm";
import type { Db } from "./client";
import { alerts, telegramUsers } from "./schema";

export interface BotUser {
  chatId: number;
  provinceId: string | null;
}

export interface BotAlert {
  id: string;
  chatId: number;
  query: string;
  provinceId: string | null;
  createdAt: string;
}

export async function getTelegramUser(
  db: Db,
  chatId: number,
): Promise<BotUser> {
  const [row] = await db
    .select()
    .from(telegramUsers)
    .where(eq(telegramUsers.chatId, chatId))
    .limit(1);

  if (row) {
    return { chatId: row.chatId, provinceId: row.provinceId };
  }

  await db.insert(telegramUsers).values({ chatId, provinceId: null });
  return { chatId, provinceId: null };
}

export async function setTelegramUserProvince(
  db: Db,
  chatId: number,
  provinceId: string,
): Promise<BotUser> {
  await db
    .insert(telegramUsers)
    .values({ chatId, provinceId })
    .onConflictDoUpdate({
      target: telegramUsers.chatId,
      set: { provinceId },
    });

  return { chatId, provinceId };
}

export async function addTelegramAlert(
  db: Db,
  chatId: number,
  query: string,
  provinceId: string | null,
): Promise<BotAlert> {
  await getTelegramUser(db, chatId);

  const [row] = await db
    .insert(alerts)
    .values({
      chatId,
      query: query.toLowerCase().trim(),
      provinceId,
    })
    .returning();

  return {
    id: row.id,
    chatId: row.chatId,
    query: row.query,
    provinceId: row.provinceId,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listTelegramAlerts(
  db: Db,
  chatId: number,
): Promise<BotAlert[]> {
  const rows = await db
    .select()
    .from(alerts)
    .where(eq(alerts.chatId, chatId));

  return rows.map((row) => ({
    id: row.id,
    chatId: row.chatId,
    query: row.query,
    provinceId: row.provinceId,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function removeTelegramAlert(
  db: Db,
  chatId: number,
  alertId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(alerts)
    .where(and(eq(alerts.id, alertId), eq(alerts.chatId, chatId)))
    .returning({ id: alerts.id });

  return deleted.length > 0;
}
