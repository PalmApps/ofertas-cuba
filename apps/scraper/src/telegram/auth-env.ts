import { readFileSync, existsSync } from "node:fs";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

const CODE_FILE = process.env.TELEGRAM_CODE_FILE ?? "/tmp/telegram-phone-code.txt";

function waitForCode(maxMs = 300_000): Promise<string> {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      if (existsSync(CODE_FILE)) {
        const code = readFileSync(CODE_FILE, "utf8").trim();
        if (code) {
          resolve(code);
          return;
        }
      }
      if (Date.now() - started > maxMs) {
        reject(new Error("Timeout esperando codigo en TELEGRAM_CODE_FILE"));
        return;
      }
      setTimeout(tick, 1500);
    };
    tick();
  });
}

async function main() {
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH;
  const phone = process.env.TELEGRAM_PHONE;

  if (!apiId || !apiHash || !phone) {
    throw new Error("Set TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_PHONE");
  }

  const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log(`Solicitando codigo para ${phone}...`);
  console.log(`Esperando codigo en ${CODE_FILE}`);

  await client.start({
    phoneNumber: async () => phone,
    phoneCode: async () => waitForCode(),
    password: async () => process.env.TELEGRAM_2FA_PASSWORD?.trim() ?? "",
    onError: (err) => console.error(err),
  });

  console.log("\nTELEGRAM_USER_SESSION:\n");
  console.log(client.session.save());
  await client.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
