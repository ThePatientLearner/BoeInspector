/**
 * `npm run notify:test`
 *
 * Envía un mensaje de prueba por cada canal configurado en .env, con el
 * mismo formato que usará el servicio de verdad. Sirve para comprobar que
 * el token y los permisos están bien ANTES de que llegue el cron.
 *
 * No toca la base de datos ni el BOE: solo los notificadores.
 */
import { loadConfig } from "../shared/config/config.js";
import { createLogger } from "../shared/logger/logger.js";
import {
  ConsoleNotifier,
  DiscordNotifier,
  TelegramNotifier,
  type Notifier,
} from "../modules/notifications/index.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger();

  const notifiers: Notifier[] = [];
  if (config.telegramBotToken && config.telegramChannel) {
    notifiers.push(new TelegramNotifier(config.telegramBotToken, config.telegramChannel));
  }
  if (config.discordWebhookUrl) {
    notifiers.push(new DiscordNotifier(config.discordWebhookUrl));
  }

  if (notifiers.length === 0) {
    console.error("Ningún canal configurado en .env.");
    console.error("Telegram necesita TELEGRAM_BOT_TOKEN y TELEGRAM_CHANNEL.");
    console.error("Discord necesita DISCORD_WEBHOOK_URL.");
    process.exitCode = 1;
    return;
  }

  // Una disposición real, para ver el formato definitivo y comprobar que
  // los enlaces y el pie legal salen bien.
  const message = {
    title: "PRUEBA · Nuevos horarios para camiones con mercancías peligrosas en Cataluña",
    shortPhrase:
      "Mensaje de prueba de BOE Inspector. Si lo estás leyendo, el canal está bien configurado.",
    impact: 3,
    officialUrl: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-16758",
    summaryUrl: `${config.publicWebUrl}/d/BOE-A-2026-16758`,
  };

  console.log(`Enviando a: ${notifiers.map((n) => n.channel).join(", ")}\n`);

  let failures = 0;
  for (const notifier of notifiers) {
    const result = await notifier.send(message);
    if (result.ok) {
      console.log(`✓ ${notifier.channel}: enviado`);
    } else {
      failures += 1;
      console.error(`✗ ${notifier.channel}: ${result.error.message}`);
    }
  }

  // Deja constancia en consola de cómo se vería, para comparar.
  console.log();
  await new ConsoleNotifier(logger).send(message);

  if (failures > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Fallo inesperado:", error);
  process.exit(1);
});
