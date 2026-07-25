import { loadEnv } from "./load-env";
import { createBot, registerBotCommands } from "./bot";

loadEnv();

const token = process.env.TELEGRAM_OFERTAS_BOT_TOKEN;

if (!token) {
  console.error("TELEGRAM_OFERTAS_BOT_TOKEN is required");
  process.exit(1);
}

const bot = createBot(token);

registerBotCommands(bot)
  .then(() => bot.start())
  .then(() => {
    console.log("OfertasCuba bot @Ofertas_Cuba_bot — polling activo (dev)");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
