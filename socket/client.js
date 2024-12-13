import { io } from "socket.io-client";
import "dotenv/config";
import jwt from "jsonwebtoken";
import moment from "moment-timezone";
import { Telegraf } from 'telegraf';

const secretKey = process.env.TOKEN_SECRET_KEY_ARCADE;

const exp = moment.tz("UTC").add(365, 'days').unix();  
const id_arcade_guitar_hero = 3;

const message = {
  machine: "arcade",
  id: id_arcade_guitar_hero
};

const token = jwt.sign(message, secretKey, { expiresIn: exp });

const bot_telegram = new Telegraf(process.env.BOT_TOKEN);

const fichas = {
  "fichas_compradas": 0,
  "fichas_ativas": 0
};

const socket = io("wss://feira-de-jogos.dev.br/arcade", {
  path: "/api/v2/machine",
  transports: ['websocket'],
  auth: {
    token: token
  }
});

socket.on("connect", () => {
  console.log("Conectado com sucesso!");
});

socket.on("coinInsert", (data) => {
  try {
    const { arcade, coins, operation } = data;

    if (arcade == id_arcade_guitar_hero) {
      const messageType = "coinInserted";
      const messageContent = {"arcade": arcade, "operation": operation};

      socket.emit(messageType, messageContent);

      bot_telegram.telegram.sendMessage(process.env.ID_TELEGRAM_JOAOS, "Ficha comprada!");
      bot_telegram.telegram.sendMessage(process.env.ID_TELEGRAM_JOAOP, "Ficha comprada!");

      fichas.fichas_compradas += 1;
      fichas.fichas_ativas += 1;
    }
  } catch (error) {
    console.error("Erro ao processar dados de moeda:", error);
  }
});

socket.on("connect_error", (error) => {
  console.log("Erro de conexão: ");
  console.log(error);
});

socket.on("error", (error) => {
  console.log("Erro: ");
  console.log(error);
});

bot_telegram.command("listar", (ctx) => {
  ctx.reply(`Fichas compradas ao todo: ${fichas.fichas_compradas}`);
});

bot_telegram.command("listar_ativas", (ctx) => {
  ctx.reply(`Fichas ativas atualmente: ${fichas.fichas_ativas}`);
});

bot_telegram.command("desativar", (ctx) => {
  ctx.reply("Quantas fichas deletar?");

  bot_telegram.on("text", (ctx) => {
    try {
      const fichas_deletar = Number(ctx.message.text.trim());
      
      if (fichas_deletar <= fichas.fichas_ativas) {
        fichas.fichas_ativas -= fichas_deletar;

        ctx.reply("Fichas deletadas com sucesso!");
      } else {
        ctx.reply("Número maior que a quantidade de fichas ativas atualmente");
      }
    } catch (error) {
      ctx.reply("Falha ao deletar fichas");
    }
  });
});

bot_telegram.launch();
