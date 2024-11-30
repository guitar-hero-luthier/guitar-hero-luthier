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
    }
  } catch (error) {
    console.error("Erro ao processar dados de moeda:", error);
  }
})

socket.on("connect_error", (error) => {
  console.log("Erro de conexão: ");
  console.log(error);
});

socket.on("error", (error) => {
  console.log("Erro: ");
  console.log(error);
});

bot_telegram.launch();
