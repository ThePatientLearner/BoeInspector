import { z } from "zod";

/**
 * Configuración validada en el arranque: si falta algo, el proceso
 * muere aquí, no a las 8:30 de la mañana en mitad del cron.
 * Los tokens de notificadores son opcionales: sin token, ese canal
 * simplemente no se activa.
 */
const configSchema = z.object({
  databaseUrl: z.string().min(1),
  // Proveedor de IA: cualquier API compatible con el formato de OpenAI.
  // Cambiar de proveedor = cambiar estas tres variables, sin tocar código.
  aiBaseUrl: z.string().url().default("https://api.minimax.io/v1"),
  aiModel: z.string().min(1).default("MiniMax-M3"),
  aiApiKey: z.string().min(1),
  // Segunda pasada: la IA revisa su propio resumen contra el texto oficial.
  // Duplica el coste (céntimos) y corrige idioma, fidelidad y precisión.
  aiReview: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  /**
   * Impacto mínimo (1-5) para publicar en los canales. Por debajo, la
   * disposición se ingiere y aparece en la web, pero no se notifica: los
   * trámites internos no merecen un aviso en el móvil de nadie.
   * Poner 1 equivale a notificarlo todo.
   */
  notifyMinImpact: z.coerce.number().int().min(1).max(5).default(3),
  cronSchedule: z.string().min(1).default("30 8 * * 1-6"),
  timeZone: z.string().min(1).default("Europe/Madrid"),
  apiPort: z.coerce.number().int().positive().default(3001),
  publicWebUrl: z.string().url().default("http://localhost:3000"),
  boeSections: z.string().default("1"),
  telegramBotToken: z.string().optional(),
  telegramChannel: z.string().optional(),
  discordWebhookUrl: z.string().optional(),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return configSchema.parse({
    databaseUrl: env["DATABASE_URL"],
    aiBaseUrl: env["AI_BASE_URL"],
    aiModel: env["AI_MODEL"],
    aiApiKey: env["AI_API_KEY"],
    aiReview: env["AI_REVIEW"],
    notifyMinImpact: env["NOTIFY_MIN_IMPACT"],
    cronSchedule: env["CRON_SCHEDULE"],
    timeZone: env["TZ"],
    apiPort: env["API_PORT"],
    publicWebUrl: env["PUBLIC_WEB_URL"],
    boeSections: env["BOE_SECTIONS"],
    telegramBotToken: env["TELEGRAM_BOT_TOKEN"] || undefined,
    telegramChannel: env["TELEGRAM_CHANNEL"] || undefined,
    discordWebhookUrl: env["DISCORD_WEBHOOK_URL"] || undefined,
  });
}
