# BOE Inspector — Plan del proyecto

Web + canales (Telegram, Discord y más adelante WhatsApp) que publican cada día
lo nuevo del BOE (Sección I — Disposiciones generales) con enlace oficial y un
resumen por puntos generado por IA.

**Servicio gratuito y sin ánimo de lucro**, construido también como pieza de
portfolio técnico — ver [PORTFOLIO.md](PORTFOLIO.md).

**Estilo arquitectónico: monolito modular en TypeScript.** Un único backend
desplegable, organizado en módulos con fronteras explícitas y clean
architecture dentro de cada uno. Si algún día hay que escalar, cada módulo
puede extraerse a su propio servicio sin reescribir el dominio. Todo
dockerizado para llevarlo a cualquier servidor.

## 1. Fuente de datos (oficial, sin scraping)

- **Sumario diario:** `GET https://boe.es/datosabiertos/api/boe/sumario/{yyyymmdd}`
  (cabecera `Accept: application/json`). Devuelve todas las disposiciones del día
  con identificador (`BOE-A-2026-XXXXX`), título, departamento y URLs oficiales
  (PDF / HTML / XML).
- **Texto de cada disposición:** URL XML/HTML incluida en el sumario
  (ej. `https://www.boe.es/diario_boe/xml.php?id=BOE-A-2026-XXXXX`).
- El BOE se publica de lunes a sábado, ~07:30 (Europe/Madrid). Si el día no hay
  boletín la API responde 404 → se registra y no pasa nada.
- **Alcance v1:** solo Sección I (5–30 ítems/día). El filtro es configuración,
  ampliable después.

## 2. El monolito y sus módulos

Un solo proceso Node (contenedor `app`) que contiene cron, API HTTP y los
cuatro módulos de negocio. La web (Next.js) es frontend puro contra la API.

```
┌──────────────────────────────  app (monolito)  ──────────────────────────────┐
│                                                                              │
│  cron 08:30 ──▶ ┌───────────┐  EntryIngested   ┌───────────────┐             │
│  (+reintentos)  │ ingestion ├─────────────────▶│ summarization │             │
│                 └───────────┘   (event bus)    └───────┬───────┘             │
│                                                        │ SummaryGenerated    │
│                                        ┌───────────────▼──┐                  │
│                                        │  notifications   │──▶ Telegram      │
│                                        └──────────────────┘    Discord       │
│                                                                (WhatsApp f2) │
│  API HTTP (Fastify) ◀── ┌─────────┐                                          │
│  /api/days /api/entries │ catalog │  (solo lectura para la web + RSS)        │
│                         └─────────┘                                          │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                              ┌─────▼─────┐        ┌──────────────┐
                              │ Postgres  │        │ web (Next.js)│
                              └───────────┘        └──────────────┘
```

### Módulos (bounded contexts)

| Módulo | Responsabilidad | Emite / escucha |
|---|---|---|
| `ingestion` | Consultar el sumario del BOE, detectar disposiciones nuevas, descargar su texto y persistirlas. | Emite `EntryIngested` |
| `summarization` | Generar frase corta + puntos con IA (dos pasadas: redacción y revisión) y guardar el resumen. | Escucha `EntryIngested`, emite `SummaryGenerated` |
| `notifications` | Publicar en cada canal y registrar qué se notificó. | Escucha `SummaryGenerated` |
| `catalog` | Consultas de lectura para la web y el RSS. | — |

### Reglas de frontera (lo que lo hace "modular" de verdad)

1. **Cada módulo expone solo su `index.ts` público** (API del módulo + eventos).
   Nada importa de las tripas de otro módulo — se refuerza con
   `eslint-plugin-boundaries` o `dependency-cruiser` en CI.
2. **Comunicación entre módulos = eventos de dominio** por un event bus en
   memoria (puerto `EventBus`). Hoy es un `EventEmitter` tipado; mañana el
   adapter puede ser Redis/RabbitMQ y cada módulo un servicio — sin tocar
   dominio ni casos de uso. Esta es la costura de escalado.
3. **Esquema de BD por módulo** (schemas de Postgres: `ingestion.*`,
   `summarization.*`, …). Un módulo no lee tablas de otro; `catalog` consume
   vistas de lectura. Así la futura separación de BD ya está dibujada.
4. **Shared kernel mínimo** (`shared/`): tipos base (`BoeId`, `Result`),
   `EventBus`, logger, config. Sin lógica de negocio.

### Clean architecture dentro de cada módulo

```
src/
├── shared/                     # kernel compartido (sin negocio)
│   ├── domain/                 #   BoeId, Result, DomainEvent
│   ├── event-bus/              #   puerto EventBus + InMemoryEventBus
│   └── config/  logger/
├── modules/
│   ├── ingestion/
│   │   ├── domain/             # BoeEntry, puerto BoeGateway, EntryRepository
│   │   ├── application/        # IngestDailyBulletin
│   │   ├── infrastructure/     # BoeApiGateway, PostgresEntryRepository (Drizzle)
│   │   └── index.ts            # API pública del módulo
│   ├── summarization/
│   │   ├── domain/             # Summary, puerto Summarizer
│   │   ├── application/        # SummarizeEntry
│   │   ├── infrastructure/     # HttpSummarizer, PostgresSummaryRepository
│   │   └── index.ts
│   ├── notifications/
│   │   ├── domain/             # NotificationLog, puerto Notifier (1 por canal)
│   │   ├── application/        # NotifyEntry
│   │   ├── infrastructure/     # TelegramNotifier, DiscordNotifier, (WhatsApp)
│   │   └── index.ts
│   └── catalog/
│       ├── application/        # GetDay, GetEntry, ListDays (queries)
│       ├── infrastructure/     # vistas de lectura
│       └── index.ts
├── api/                        # Fastify: rutas /api/* + /feed.xml
├── scheduler/                  # node-cron → dispara IngestDailyBulletin
└── main.ts                     # composición (wiring de módulos y adapters)
```

- `domain/` no depende de nada; `application/` solo de `domain/`;
  `infrastructure/` implementa los puertos. La composición vive solo en `main.ts`.
- Idempotencia: el `id` del BOE es clave única y las transiciones de estado
  (`pendiente → resumida → notificada | error`) hacen que re-ejecutar el cron
  nunca duplique ni re-notifique.

## 3. La IA: HTTP directo contra una API compatible con OpenAI

El adapter `HttpSummarizer` llama por HTTP a la API configurada. Cambiar de
proveedor son tres variables de entorno, sin tocar código:

```bash
AI_BASE_URL=https://api.minimax.io/v1   # MiniMax por defecto
AI_MODEL=MiniMax-M3
AI_API_KEY=…
# OpenAI → https://api.openai.com/v1 · DeepSeek, Groq, Ollama local, etc.
```

> **Por qué no opencode.** El primer diseño invocaba el CLI de opencode.
> Medido contra la API real: **más de 3 minutos por resumen y dos timeouts
> agotados**, frente a **~10 s** por HTTP directo. La causa es conceptual:
> opencode es un *agente de programación*, no un cliente de API — cada
> llamada abre una sesión agéntica con herramientas y contexto de directorio.
> Cambiar de adapter fue posible sin tocar dominio ni casos de uso: para eso
> existe el puerto `Summarizer`.

### Dos pasadas: redacción y revisión

1. **Redacción.** Genera `{ fraseCorta, puntos[] }`, validado con zod.
2. **Revisión.** Se le devuelve el borrador junto al texto oficial y se le pide
   corregir idioma, fidelidad, precisión y claridad.

La segunda pasada duplica el coste (céntimos) y se gana el sitio: en la primera
prueba real eliminó una frase inventada sobre infracciones legales que no
aparecía en el texto oficial. Se desactiva con `AI_REVIEW=false`.

Ambas pasadas validan que el resultado sea JSON con la forma esperada y que no
contenga alfabetos no latinos — MiniMax es multilingüe y ocasionalmente cuela
una palabra en cirílico o CJK en mitad de un texto en español. Si la validación
falla, se reintenta; si la revisión falla, se conserva el borrador (mejora, no
bloquea).

### Volumen y coste (medidos, no estimados)

Sobre diez días reales de BOE: **3,5 disposiciones de Sección I al día** (no
15 como se estimó al principio) y **~31.000 tokens de media por disposición**,
con picos de 68.000. Cuatro de esos diez días **no tenían Sección I**: habrá
mañanas sin nada que publicar, y es normal, no un error.

Con las dos pasadas: **~7 millones de tokens al mes**, que a 0,30 $/1,20 $ por
millón son **1-3 €/mes**. El VPS cuesta más que la IA.

⚠️ **Autenticar siempre con API key en variable de entorno.** Nada de sesiones
interactivas: un contenedor que depende de credenciales OAuth montadas desde el
host falla justo donde más duele, el día que el token caduque y el cron deje de
publicar en silencio.

## 3 bis. Persistencia: un schema de Postgres por módulo

Cada módulo tiene su propio schema (`ingestion`, `summarization`,
`notifications`, `catalog`) y **ninguno lee las tablas de otro**: la frontera
entre módulos existe también en la base de datos. No hay claves foráneas entre
schemas a propósito — si mañana un módulo se separa en un servicio, se lleva
sus tablas sin desenredar nada.

`catalog` es una **proyección de lectura** (CQRS ligero): una tabla
desnormalizada que se alimenta solo de los eventos de los demás módulos, así la
API responde con una consulta y sin cruzar fronteras. Al ser datos derivados,
se puede tirar y reconstruir.

> **El orden de suscripción importa.** `SummarizeEntry` emite
> `summary-generated` *desde dentro* de su handler de `entry-ingested`. Con el
> bus entregando en orden de suscripción, si el catálogo se suscribe después
> del resumidor, el resumen llega antes de que exista la fila que actualizar y
> **se pierde en silencio**. Ocurrió de verdad: la web mostraba las
> disposiciones sin resumen. La composición suscribe el catálogo el primero, y
> un `UPDATE` que no encuentra fila ahora deja un error en el log en vez de no
> hacer nada.

Las migraciones se aplican en el arranque, antes de aceptar tráfico: una
máquina nueva solo necesita `docker compose up`.

## 4. Web (Next.js, contenedor aparte, frontend puro)

- `/` — últimos días, cada disposición con su frase corta.
- `/boe/[fecha]` — boletín completo del día.
- `/d/[id]` — página de la disposición: título, departamento, **enlace oficial
  primero** (PDF y HTML del BOE) y debajo el resumen por puntos con aviso
  "resumen generado por IA; el único texto válido es el publicado en boe.es".
- Consume `/api/*` del monolito. Contenido que cambia 1 vez/día → `revalidate`
  generoso o revalidación bajo demanda al terminar la ingesta.
- RSS/Atom en `/feed.xml` (lo sirve el monolito; casi gratis y muy útil aquí).

## 5. Notificaciones

Mensaje por disposición nueva (si un día vienen >10, mensaje agrupado):

> **{título}**
> {frase corta}
> 📄 Oficial: {url BOE} · 📝 Resumen: {url web /d/id}

- **Telegram:** Bot API `sendMessage` a canal público. Solo requiere token de
  @BotFather y que el bot sea admin del canal.
- **Discord:** webhook de canal (URL en `.env`; ni siquiera hace falta bot).
- **WhatsApp (fase 2):** WhatsApp Business Cloud API (vía oficial de Meta;
  requiere cuenta business y plantillas aprobadas). El puerto ya queda definido.

## 6. Docker Compose

| Servicio | Imagen | Rol |
|---|---|---|
| `app` | Node 22 | El monolito: cron, ingesta, IA, notificaciones, API. |
| `web` | Next.js standalone | Frontend público. |
| `db` | postgres:16 | Persistencia (volumen + backup). |

`.env`:

```
DATABASE_URL=postgres://…
AI_BASE_URL=https://api.minimax.io/v1   # cambiar de proveedor = cambiar estas tres
AI_MODEL=MiniMax-M3
AI_API_KEY=…
AI_REVIEW=true                          # segunda pasada de revisión
TELEGRAM_BOT_TOKEN=…   TELEGRAM_CHANNEL=@…
DISCORD_WEBHOOK_URL=…
CRON_SCHEDULE=30 8 * * 1-6
TZ=Europe/Madrid
BOE_SECTIONS=1
PUBLIC_WEB_URL=https://…                # para componer enlaces en notificaciones
```

## 7. Fases de implementación

1. ~~**Fase 0 — Esqueleto:**~~ proyecto TS único, `shared/` + esqueleto de
   módulos, event bus tipado, docker-compose con Postgres, reglas de frontera
   verificadas por dependency-cruiser. **Hecha.**
2. ~~**Fase 1 — Ingesta:**~~ `BoeApiGateway` + `IngestDailyBulletin` y los
   adapters de Postgres (Drizzle) con migraciones. **Hecha**, validada contra
   boletines reales.
3. ~~**Fase 2 — Resúmenes:**~~ `HttpSummarizer` en dos pasadas, con JSON
   validado. **Hecha.**
4. **Fase 3 — Web:** Next.js con las 3 rutas y RSS. La proyección de lectura
   (`catalog`) ya es persistente y la API la sirve.
5. **Fase 4 — Notificaciones:** Telegram y Discord.
6. **Fase 5 — Producción:** cron definitivo con reintentos (10:00/12:00 si a
   las 08:30 no hay sumario), healthcheck, backup del volumen, deploy en VPS.
7. **Fase 6 — WhatsApp** (Cloud API) y extras: buscador, filtro por
   departamento, suscripción por temas.

## 8. Riesgos / decisiones abiertas

- **Textos muy largos** (hay disposiciones de 100+ págs.): trocear y resumir
  por partes, o resumir índice + primeras secciones. Decidir en fase 2 según
  el modelo elegido.
- **Coste IA:** ~1-3 €/mes a precio por uso, o 0 € marginales si entra en una
  suscripción ya contratada. En cualquier caso, el VPS cuesta más que la IA.
- **Autenticación del worker:** ver §3 — API key en entorno, no sesión
  interactiva. Es el fallo silencioso más probable de todo el sistema.
- **Reproducibilidad para terceros:** siendo un proyecto de portfolio con código
  público, alguien que clone el repositorio debe poder levantarlo con su propia
  API key. Documentar el `.env.example` con esto en mente y no dar por supuesta
  ninguna suscripción concreta.
- **Aviso legal:** los resúmenes son informativos; el único texto válido es el
  publicado en boe.es (los datos del BOE son reutilizables citando la fuente).
