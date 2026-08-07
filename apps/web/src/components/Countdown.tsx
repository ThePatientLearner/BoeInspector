"use client";

import { useEffect, useState } from "react";

/**
 * Cuenta atrás hasta la siguiente ingesta del BOE.
 *
 * El cron del monolito dispara la ingesta a las 08:30 Europe/Madrid de
 * lunes a sábado (`CRON_SCHEDULE="30 8 * * 1-6"`). Durante la media hora
 * posterior el BOE todavía está asentando su sumario y la IA puede tardar
 * varios minutos en procesar todas las fichas: en esa ventana el contador
 * se sustituye por un cartel de "IA revisando BOE" con un spinner, para
 * que el visitante entienda que no hay un fallo sino un proceso en curso.
 *
 * El componente es cliente y se rehidrata cada segundo. Para evitar el
 * mismatch de hidratación, el primer paint del servidor es un placeholder
 * y el contenido real entra después del `useEffect`.
 */
const TIME_ZONE = "Europe/Madrid";
const INGESTION_HOUR = 8;
const INGESTION_MINUTE = 30;
/** Ventana tras el disparo del cron en la que se muestra "IA revisando BOE". */
const REVISION_WINDOW_MIN = 30;

type Parts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number; // 0=Dom, 1=Lun, ..., 6=Sáb
};

function madridParts(d: Date): Parts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  // `hour: "2-digit"` puede devolver "24" en lugar de "00" en algunos
  // motores al pasar medianoche; lo normalizamos.
  const hour = +get("hour") % 24;
  return {
    year: +get("year"),
    month: +get("month"),
    day: +get("day"),
    hour,
    minute: +get("minute"),
    second: +get("second"),
    weekday: weekdayMap[get("weekday")] ?? 0,
  };
}

/** Offset de Madrid respecto a UTC, en minutos, en un instante dado. */
function madridOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    timeZoneName: "longOffset",
  }).formatToParts(at);
  const offset = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+00:00";
  const m = offset.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!m) return 0;
  return (m[1] === "+" ? 1 : -1) * (+m[2] * 60 + +m[3]);
}

/** Convierte una fecha-hora Madrid a un timestamp UTC. Dos iteraciones
 *  bastan: la primera pasada elige el offset de la hora de Madrid adyacente
 *  (suficiente porque ningún día cambia de offset a las 08:30). */
function madridWallToUtc(year: number, monthIdx: number, day: number, hour: number, minute: number): number {
  let utc = Date.UTC(year, monthIdx, day, hour, minute) - 2 * 60 * 60 * 1000;
  for (let i = 0; i < 3; i++) {
    const off = madridOffsetMinutes(new Date(utc));
    utc = Date.UTC(year, monthIdx, day, hour, minute) - off * 60 * 1000;
  }
  return utc;
}

/** Próximo instante 08:30 Madrid en día laborable (L-S) posterior a `now`. */
function nextIngestionUtc(now: Date): number {
  const p = madridParts(now);
  const minutesNow = p.hour * 60 + p.minute;
  const isWorkday = p.weekday >= 1 && p.weekday <= 6;

  let dayDelta = 0;
  if (isWorkday && minutesNow < INGESTION_HOUR * 60 + INGESTION_MINUTE) {
    dayDelta = 0;
  } else {
    dayDelta = 1;
    let nextDow = (p.weekday + 1) % 7;
    while (nextDow === 0) {
      dayDelta++;
      nextDow = (nextDow + 1) % 7;
    }
  }

  // Sumamos `dayDelta` días civiles Madrid. Como el cambio horario puede
  // hacer que +24h UTC no caiga en el día Madrid siguiente en el día de
  // transición, iteramos día a día sobre el calendario Madrid.
  let year = p.year;
  let month = p.month;
  let day = p.day;
  for (let i = 0; i < dayDelta; i++) {
    const next = new Date(madridWallToUtc(year, month - 1, day, 12, 0) + 36 * 60 * 60 * 1000);
    const np = madridParts(next);
    year = np.year;
    month = np.month;
    day = np.day;
  }

  return madridWallToUtc(year, month - 1, day, INGESTION_HOUR, INGESTION_MINUTE);
}

function formatHMS(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function Countdown() {
  // Pintamos el placeholder en el servidor y la primera vez en cliente para
  // que el HTML estático no dependa del reloj del build.
  const [mounted, setMounted] = useState(false);
  const [target, setTarget] = useState<number | null>(null);
  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
    setTarget(nextIngestionUtc(new Date()));
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  if (!mounted || target === null) {
    return (
      <div className="countdown countdown-placeholder" aria-hidden="true">
        <span className="countdown-clock" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M12 13 V8 M12 13 L15 15"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M9 3 H15 M12 3 V5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="countdown-text">Próxima revisión: --:--:--</span>
      </div>
    );
  }

  const p = madridParts(new Date(now));
  const minutesNow = p.hour * 60 + p.minute;
  const isWorkday = p.weekday >= 1 && p.weekday <= 6;
  const windowEnd = INGESTION_HOUR * 60 + INGESTION_MINUTE + REVISION_WINDOW_MIN;
  const inProgress =
    isWorkday && minutesNow >= INGESTION_HOUR * 60 + INGESTION_MINUTE && minutesNow < windowEnd;

  if (inProgress) {
    return (
      <div className="countdown countdown-progress" role="status">
        <span className="countdown-robot" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect x="4" y="9" width="16" height="10" rx="2" fill="currentColor" opacity="0.18" />
            <rect
              x="4"
              y="9"
              width="16"
              height="10"
              rx="2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle cx="9.5" cy="14" r="1.2" fill="currentColor" />
            <circle cx="14.5" cy="14" r="1.2" fill="currentColor" />
            <path
              d="M12 9 V6 M10 6 H14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <rect x="2" y="11" width="2" height="6" rx="1" fill="currentColor" />
            <rect x="20" y="11" width="2" height="6" rx="1" fill="currentColor" />
          </svg>
          <span className="countdown-spinner" aria-hidden="true" />
        </span>
        <span className="countdown-text">IA revisando BOE</span>
      </div>
    );
  }

  const remaining = target - now;
  return (
    <div className="countdown" role="status">
      <span className="countdown-clock" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M12 13 V8 M12 13 L15 15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M9 3 H15 M12 3 V5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="countdown-text">
        <span className="countdown-label">Próxima revisión</span>
        <span className="countdown-time" aria-live="off">
          {formatHMS(remaining)}
        </span>
      </span>
    </div>
  );
}