import { Bot, InlineKeyboard } from "grammy";
import {
  PROVINCES,
  containsBlacklistedTerm,
  extractCurrency,
  extractPhone,
  extractPrice,
  findProvinceByName,
  looksLikeOffer,
  normalizeProductKey,
} from "@ofertas-cuba/shared";
import {
  addAlert,
  getUser,
  listAlerts,
  removeAlert,
  setUserProvince,
} from "./store";
import {
  formatOfferLine,
  indexForwardedOffer,
  searchProductOffers,
} from "./offers";

export function createBot(token: string): Bot {
  const bot = new Bot(token);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://ofertascuba.vercel.app";

  function provinceName(provinceId: string | null): string {
    if (!provinceId) return "Toda Cuba";
    return PROVINCES.find((p) => p.id === provinceId)?.name ?? provinceId;
  }

  function provincePickerKeyboard(): InlineKeyboard {
    const kb = new InlineKeyboard();
    for (const p of PROVINCES) {
      kb.text(p.name, `prov:${p.id}`).row();
    }
    return kb;
  }

  async function indexOfferText(
    text: string,
    provinceId: string | null,
    sourceUrl: string | null,
  ): Promise<boolean> {
    if (!looksLikeOffer(text)) return false;
    return indexForwardedOffer(text, provinceId, sourceUrl);
  }

  bot.command("start", async (ctx) => {
    try {
      const user = await getUser(ctx.chat.id);
      const lines = [
        "OfertasCuba — compara ofertas de compra y venta en Cuba.",
        "",
        "Comandos:",
        "/buscar <producto>",
        "/alerta <producto>",
        "/provincia <nombre>",
        "/misalertas",
        "",
        `Web: ${appUrl}`,
        "",
        "Reenvia un post o captura para ayudar a indexar ofertas.",
      ];

      if (!user.provinceId) {
        await ctx.reply(
          [...lines, "", "Elige tu provincia para empezar:"].join("\n"),
          { reply_markup: provincePickerKeyboard() },
        );
        return;
      }

      lines.splice(
        2,
        0,
        `Provincia: ${provinceName(user.provinceId)}`,
        "",
      );
      await ctx.reply(lines.join("\n"));
    } catch (err) {
      console.error("/start error:", err);
      await ctx.reply(
        "OfertasCuba — compara ofertas en Cuba.\n\nElige provincia con /provincia La Habana",
      );
    }
  });

  bot.callbackQuery(/^prov:(.+)$/, async (ctx) => {
    const provinceId = ctx.match[1];
    const province = PROVINCES.find((p) => p.id === provinceId);
    if (!province) {
      await ctx.answerCallbackQuery({ text: "Provincia no valida" });
      return;
    }
    await setUserProvince(ctx.chat!.id, province.id);
    await ctx.answerCallbackQuery({ text: `Provincia: ${province.name}` });
    await ctx.editMessageText(
      `Listo. Provincia: ${province.name}.\n\nPrueba /buscar iphone o /alerta arroz`,
    );
  });

  bot.command("provincia", async (ctx) => {
    const query = ctx.match?.trim();
    if (!query) {
      await ctx.reply("Elige provincia:", {
        reply_markup: provincePickerKeyboard(),
      });
      return;
    }
    const match = findProvinceByName(query);
    if (!match) {
      await ctx.reply("Provincia no encontrada. Prueba /provincia La Habana");
      return;
    }
    await setUserProvince(ctx.chat.id, match.id);
    await ctx.reply(`Provincia guardada: ${match.name}`);
  });

  bot.command("buscar", async (ctx) => {
    const query = ctx.match?.trim();
    if (!query) {
      await ctx.reply("Uso: /buscar iphone 13");
      return;
    }
    const user = await getUser(ctx.chat.id);
    const province = provinceName(user.provinceId);
    const searchUrl = `${appUrl}/?q=${encodeURIComponent(query)}&provincia=${user.provinceId ?? ""}`;
    const results = await searchProductOffers(query, user.provinceId);

    const lines = [
      `Busqueda: "${query}"`,
      `Provincia: ${province}`,
      "",
    ];

    if (results.length === 0) {
      lines.push(
        "Sin resultados en el indice.",
        "Prueba otro termino o reenvia ofertas al bot.",
      );
    } else {
      lines.push(`${results.length} resultado(s):`, "");
      for (const offer of results) {
        lines.push(formatOfferLine(offer));
      }
    }

    lines.push("", `Ver en web: ${searchUrl}`);
    await ctx.reply(lines.join("\n"));
  });

  bot.command("alerta", async (ctx) => {
    const query = ctx.match?.trim();
    if (!query) {
      await ctx.reply("Uso: /alerta arroz");
      return;
    }
    const user = await getUser(ctx.chat.id);
    const alert = await addAlert(ctx.chat.id, query, user.provinceId);
    await ctx.reply(
      [
        `Alerta creada (#${alert.id.slice(0, 8)})`,
        `Producto: ${query}`,
        `Provincia: ${provinceName(user.provinceId)}`,
        "",
        "Te avisaremos cuando aparezca una oferta.",
      ].join("\n"),
    );
  });

  bot.command("misalertas", async (ctx) => {
    const items = await listAlerts(ctx.chat.id);
    if (items.length === 0) {
      await ctx.reply("No tienes alertas. Crea una con /alerta <producto>");
      return;
    }
    const kb = new InlineKeyboard();
    const lines = items.map((a) => {
      kb.text(`Borrar #${a.id.slice(0, 8)}`, `del:${a.id}`).row();
      return `#${a.id.slice(0, 8)} — ${a.query} (${provinceName(a.provinceId)})`;
    });
    await ctx.reply(["Tus alertas:", "", ...lines].join("\n"), {
      reply_markup: kb,
    });
  });

  bot.callbackQuery(/^del:(.+)$/, async (ctx) => {
    const id = ctx.match[1];
    const ok = await removeAlert(ctx.chat!.id, id);
    await ctx.answerCallbackQuery({
      text: ok ? "Alerta eliminada" : "No encontrada",
    });
    if (ok) {
      await ctx.editMessageText(`Alerta #${id.slice(0, 8)} eliminada.`);
    }
  });

  bot.on("message:text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) return;

    const text = ctx.message.text;
    const isForward = ctx.message.forward_origin !== undefined;

    if (!isForward) return;

    if (containsBlacklistedTerm(text)) {
      await ctx.reply("No se puede indexar este contenido.");
      return;
    }

    const price = extractPrice(text);
    const currency = extractCurrency(text);
    const phone = extractPhone(text);
    const productKey = normalizeProductKey(text);
    const user = await getUser(ctx.chat!.id);
    const indexed = await indexOfferText(text, user.provinceId, null);

    await ctx.reply(
      [
        indexed ? "Gracias. Oferta indexada." : "Gracias. Oferta recibida.",
        "",
        `Producto: ${productKey.slice(0, 80) || "(sin texto)"}`,
        price ? `Precio detectado: ${price} ${currency}` : "Precio: no detectado",
        phone ? `Telefono: ${phone}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  });

  bot.on("message:photo", async (ctx) => {
    const caption = ctx.message.caption ?? "";
    if (caption && containsBlacklistedTerm(caption)) {
      await ctx.reply("No se puede indexar este contenido.");
      return;
    }

    if (caption) {
      const user = await getUser(ctx.chat.id);
      const indexed = await indexOfferText(caption, user.provinceId, null);
      await ctx.reply(
        indexed
          ? "Foto recibida. Texto indexado."
          : "Foto recibida. Sin texto util para indexar.",
      );
      return;
    }

    await ctx.reply("Foto recibida. Anade texto o caption para indexar.");
  });

  bot.on("channel_post:text", async (ctx) => {
    const text = ctx.channelPost.text;
    if (!text || text.startsWith("/")) return;
    if (containsBlacklistedTerm(text)) return;
    if (!looksLikeOffer(text)) return;
    await indexForwardedOffer(text, null, null, "telegram");
  });

  bot.catch((err) => {
    console.error("Bot error:", err);
  });

  return bot;
}

export async function registerBotCommands(bot: Bot): Promise<void> {
  await bot.api.setMyCommands([
    { command: "start", description: "Iniciar y elegir provincia" },
    { command: "buscar", description: "Buscar un producto" },
    { command: "alerta", description: "Crear alerta de precio" },
    { command: "provincia", description: "Cambiar provincia" },
    { command: "misalertas", description: "Ver tus alertas" },
  ]);
}
