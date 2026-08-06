import { pino, type Logger } from "pino";

export type { Logger } from "pino";

export function createLogger(): Logger {
  return pino({
    level: process.env["LOG_LEVEL"] ?? "info",
    ...(process.env["NODE_ENV"] !== "production" && {
      transport: { target: "pino-pretty", options: { translateTime: "HH:MM:ss" } },
    }),
  });
}
