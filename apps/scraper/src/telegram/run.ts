import { runTelegramScraper } from "./scrape.js";

runTelegramScraper()
  .then(({ offers, channels }) => {
    console.log(
      `Telegram scrape complete — ${offers} ofertas, ${channels} fuentes`,
    );
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
