# BOE Inspector

**El BOE, resumido cada día.** Servicio gratuito que ingiere las disposiciones
generales del Boletín Oficial del Estado (Sección I), las resume con IA en
lenguaje claro y las publica en una web y en canales de Telegram y Discord —
siempre con el enlace al texto oficial primero.

> ⚠️ Proyecto independiente. No vinculado a la Agencia Estatal Boletín Oficial
> del Estado. Los resúmenes los genera una IA y el único texto con valor
> oficial es el publicado en [boe.es](https://www.boe.es).

## Arquitectura

Monolito modular en TypeScript con clean architecture: cuatro módulos
(`ingestion`, `summarization`, `notifications`, `catalog`) que se comunican
exclusivamente por eventos de dominio a través de un event bus en memoria.
Las fronteras las verifica `dependency-cruiser` en CI.

```
cron 08:30 ─▶ ingestion ──EntryIngested──▶ summarization ──SummaryGenerated──▶ notifications ─▶ Telegram/Discord
                   │                              │
                   └──────────▶ catalog ◀─────────┘        (proyección de lectura)
                                   ▲
                       API Fastify │  ◀── web (Next.js)
```

- **Dominio y casos de uso** sin dependencias de framework; puertos + adapters.
- **IA intercambiable**: el resumidor habla HTTP con cualquier API compatible
  con el formato de OpenAI (MiniMax por defecto). Cambiar de proveedor son tres
  variables de entorno.
- **Resúmenes en dos pasadas**: redacción y una segunda pasada de revisión que
  contrasta el borrador con el texto oficial y corrige idioma, fidelidad y
  precisión.
- **Idempotente por diseño**: la clave natural del BOE (`BOE-A-…`) y las
  transiciones de estado (`pendiente → resumida → notificada`) hacen que
  re-ejecutar el cron nunca duplique ni re-notifique. Medido: repetir un día
  ya publicado tarda 2 s y no gasta un solo token.
- **Persistencia en Postgres**, con un schema por módulo y migraciones que se
  aplican solas en el arranque.

Documentos de diseño: [PLAN.md](PLAN.md) · [PORTFOLIO.md](PORTFOLIO.md) ·
[LEGAL.md](LEGAL.md)

## Desarrollo

```bash
npm install
cp .env.example .env         # rellena AI_API_KEY con la clave de tu proveedor
docker compose up -d db      # Postgres: el monolito no arranca sin él

npm run dev                  # monolito (API en :3001) — migra al arrancar
npm run dev:web              # frontend Next.js (:3000)

npm test                     # tests unitarios (sin red ni base de datos)
npm run test:integration     # adapters de Postgres (necesita el contenedor db)
npm run typecheck
npm run check:boundaries     # fronteras del monolito modular
```

### Base de datos

Un schema de Postgres por módulo (`ingestion`, `summarization`,
`notifications`, `catalog`): ningún módulo lee las tablas de otro, así que la
frontera entre módulos también existe en la base de datos.

```bash
npm run db:generate -w @boe-inspector/monolith   # SQL nuevo tras tocar un schema.ts
npm run db:apply    -w @boe-inspector/monolith   # aplicar migraciones a mano
```

El arranque aplica las migraciones pendientes por su cuenta, así que en una
máquina nueva basta con `docker compose up`.

### Probar contra el BOE real, sin esperar al cron

```bash
npm run probe                # una disposición de punta a punta, paso a paso
npm run ingest               # ingesta completa del último día disponible
npm run ingest -- 2026-07-23 # ingesta de una fecha concreta
```

`probe` recorre la cadena entera con la disposición más reciente —API del BOE,
extracción del texto, redacción, revisión— e imprime cada paso y qué corrigió
la revisión. Es el comando para responder a "¿esto funciona?".

`ingest` ejecuta el mismo código que corre a las 8:30, con eventos y
notificaciones. Es seguro repetirlo: la ingesta es idempotente, así que también
sirve para recuperar un día perdido.

```bash
npm run notify:test          # mensaje de prueba por cada canal configurado
```

`notify:test` envía a Telegram y Discord un mensaje con el formato definitivo,
sin tocar la base de datos ni el BOE. Es la forma de comprobar tokens y
permisos antes de que llegue el cron.

Para trastear con prompts o comprobar la clave sin arrancar nada, hay un atajo
sobre la misma API:

```bash
./scripts/ask-ai.sh "resume la Ley 40/2015 en tres líneas"
cat texto.txt | ./scripts/ask-ai.sh "resume esto"
AI_MODEL=MiniMax-M3 npm run probe        # comparar modelos sin tocar .env
```

### Copias de seguridad

```bash
./scripts/backup-db.sh                          # → backups/boe-FECHA.sql.gz
./scripts/restore-db.sh backups/boe-FECHA.sql.gz
```

La copia es un volcado lógico, no una copia del volumen: se restaura en
cualquier Postgres 16, en cualquier máquina y arquitectura.

## Despliegue

```bash
docker compose up -d --build
```

Tres contenedores: `app` (monolito), `web` (Next.js standalone) y
`db` (Postgres 16 con volumen).

## Estado del proyecto

- [x] Fase 0 — Esqueleto: módulos, event bus, fronteras, tests, compose
- [x] Fase 1 — Ingesta con Postgres (adapters Drizzle + migraciones)
- [x] Fase 2 — Resúmenes en dos pasadas, validados contra el BOE real
- [ ] Fase 3 — Web completa + RSS (la proyección ya es persistente)
- [ ] Fase 4 — Notificadores en producción
- [ ] Fase 5 — Cron con reintentos, alertas de fallo, backup
- [ ] Fase 6 — WhatsApp (Cloud API) y extras
