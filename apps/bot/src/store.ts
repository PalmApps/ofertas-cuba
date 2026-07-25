/** Bot user/alert store — Neon when DATABASE_URL is set, else in-memory. */

import {
  addTelegramAlert,
  createDb,
  getTelegramUser,
  listTelegramAlerts,
  removeTelegramAlert,
  setTelegramUserProvince,
} from "@ofertas-cuba/db";

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

const users = new Map<number, BotUser>();
const alerts = new Map<number, BotAlert[]>();
let alertSeq = 1;

function useDb(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function getUser(chatId: number): Promise<BotUser> {
  if (useDb()) {
    return getTelegramUser(createDb(), chatId);
  }

  const existing = users.get(chatId);
  if (existing) return existing;
  const user: BotUser = { chatId, provinceId: null };
  users.set(chatId, user);
  return user;
}

export async function setUserProvince(
  chatId: number,
  provinceId: string,
): Promise<BotUser> {
  if (useDb()) {
    return setTelegramUserProvince(createDb(), chatId, provinceId);
  }

  const user = await getUser(chatId);
  user.provinceId = provinceId;
  users.set(chatId, user);
  return user;
}

export async function addAlert(
  chatId: number,
  query: string,
  provinceId: string | null,
): Promise<BotAlert> {
  if (useDb()) {
    return addTelegramAlert(createDb(), chatId, query, provinceId);
  }

  const list = alerts.get(chatId) ?? [];
  const alert: BotAlert = {
    id: String(alertSeq++),
    chatId,
    query: query.toLowerCase().trim(),
    provinceId,
    createdAt: new Date().toISOString(),
  };
  list.push(alert);
  alerts.set(chatId, list);
  return alert;
}

export async function listAlerts(chatId: number): Promise<BotAlert[]> {
  if (useDb()) {
    return listTelegramAlerts(createDb(), chatId);
  }
  return alerts.get(chatId) ?? [];
}

export async function removeAlert(
  chatId: number,
  alertId: string,
): Promise<boolean> {
  if (useDb()) {
    return removeTelegramAlert(createDb(), chatId, alertId);
  }

  const list = alerts.get(chatId) ?? [];
  const next = list.filter((a) => a.id !== alertId);
  if (next.length === list.length) return false;
  alerts.set(chatId, next);
  return true;
}
