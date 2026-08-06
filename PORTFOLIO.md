# BOE Inspector — Proyecto de portfolio

> Sustituye al antiguo plan de negocio: el proyecto es **gratuito, abierto y sin
> ánimo de lucro**. Complementa a [PLAN.md](PLAN.md) (arquitectura) y
> [LEGAL.md](LEGAL.md) (textos legales).

## 1. Qué es y por qué

Un servicio público y gratuito que cada día publica lo nuevo del BOE (Sección I)
con enlace oficial y resumen por puntos generado por IA, y lo difunde por
Telegram y Discord.

Dos objetivos, y ambos importan:

1. **Utilidad real.** Que alguien lo use de verdad. Un proyecto de portfolio con
   usuarios reales vale infinitamente más que una demo bonita sin tráfico.
2. **Demostración técnica.** Es una pieza que enseña arquitectura, no sintaxis.

## 2. Qué demuestra técnicamente

Esto es lo que un técnico ve al abrir el repositorio, y conviene que el README
lo haga evidente en los primeros 30 segundos:

| Competencia | Cómo se demuestra aquí |
|---|---|
| **Clean architecture aplicada** | Dominio sin dependencias, puertos e implementaciones separadas, la composición aislada en `main.ts`. No es un tutorial: hay decisiones reales. |
| **Monolito modular con fronteras reales** | Cuatro módulos comunicados solo por eventos, fronteras verificadas por lint en CI. Enseña que entiendes *por qué* se separan las cosas, no solo cómo crear carpetas. |
| **Diseño para el cambio** | El proveedor de IA, la base de datos y cada canal de notificación son adaptadores intercambiables. Cambiar de MiniMax a Claude es una variable de entorno. |
| **TypeScript de verdad** | Tipado del dominio, validación en los bordes con zod, sin `any` de conveniencia. |
| **Integración de IA con criterio** | Salida estructurada validada, reintentos, troceado de textos largos, y — lo más valioso — límites claros sobre lo que la IA no debe decidir. |
| **Sistemas que corren solos** | Cron, idempotencia por clave natural, reintentos, healthchecks, tolerancia a que el BOE no publique. |
| **Docker y portabilidad** | `docker compose up` y funciona en cualquier VPS. |
| **Producto, no solo código** | Aviso legal, RGPD, transparencia de IA, accesibilidad. Muy pocos portfolios junior llegan aquí, y es justo lo que distingue a alguien que ha pensado en el usuario. |

**El argumento fuerte para una entrevista:** no es un CRUD de ejemplo. Es un
sistema que ingiere datos de una fuente externa que no controlas, los procesa
con un modelo probabilístico, y publica el resultado en tres sitios distintos
sin que nadie lo supervise. Eso da conversación para media entrevista.

## 3. Cómo presentarlo

El código sin escaparate no luce. Por orden de impacto:

1. **README con demo en vivo arriba del todo.** Enlace al sitio funcionando y al
   canal de Telegram, antes que ninguna instrucción de instalación. Que se pueda
   comprobar que funciona sin clonar nada.
2. **Diagrama de arquitectura** en el propio README (el de [PLAN.md](PLAN.md)
   sirve). Una imagen ahorra cinco párrafos.
3. **Sección "decisiones de diseño"** explicando *por qué* monolito modular y no
   microservicios, por qué eventos entre módulos, por qué el proveedor de IA es
   intercambiable. Explicar los trade-offs vale más que el código en sí.
4. **Un artículo** contando cómo lo construiste — en tu blog o LinkedIn. Es lo
   que hace que el proyecto circule; el repositorio solo no circula.
5. **Capturas** de la web y de un mensaje real del canal.

## 4. Qué añadir para que destaque

Priorizado por relación impacto/esfuerzo:

- [ ] **Tests del dominio y los casos de uso.** Lo primero que mira alguien
      técnico. Con fixtures de sumarios reales del BOE de días pasados.
- [ ] **CI en GitHub Actions** — tests, lint, comprobación de fronteras entre
      módulos, build de las imágenes. El badge en verde comunica solo.
- [ ] **Página de estado** (`/status`): última ejecución, disposiciones
      procesadas, errores. Demuestra que piensas en operación, no solo en código.
- [ ] **Feed RSS** — cuesta muy poco y da utilidad real inmediata.
- [ ] **Accesibilidad y rendimiento** — contraste, navegación por teclado,
      Lighthouse en verde. Es diferencial y casi nadie lo cuida.
- [ ] **Métricas básicas** (Prometheus o un endpoint propio) con latencia de
      ingesta, coste de IA acumulado y tasa de fallos.
- [ ] **Modo oscuro y diseño propio.** La web va a ser lo primero que vean; que
      no parezca una plantilla.

## 5. Coste y sostenibilidad

| Concepto | Coste mensual |
|---|---|
| VPS (2 vCPU, 4 GB) | 6-12 € |
| Dominio | ~1 € |
| IA (MiniMax, Sección I) | 1-3 €, o 0 € marginales si entra en una suscripción ya contratada |
| Telegram / Discord / RSS | 0 € |
| **Total** | **~8-16 €/mes** |

> **Sobre usar una suscripción mensual en lugar de API por uso:** el consumo del
> servicio es de ~4 millones de tokens al mes, así que cabe en cualquier plan sin
> despeinarse. Pero conviene tener presente que a precio por uso este trabajo
> cuesta 1-3 €/mes — es decir, **menos que la propia suscripción**. Si algún día
> el plan da problemas (límites, términos de uso, autenticación), migrar a una
> API key de pago por uso no es un plan B caro: es más barato que el plan A.
> Ver la nota de autenticación en [PLAN.md](PLAN.md) §3.

Menos que una suscripción de streaming, y sin obligaciones fiscales al no haber
ingresos. **Al no monetizar, no hace falta alta de autónomo, ni IVA, ni
facturación, ni condiciones de contratación** — que era, con diferencia, la
parte más pesada del proyecto.

Alternativa de coste casi cero: Vercel/Railway en capa gratuita + Neon o Supabase
para Postgres. Pero un VPS de 6 € da menos sorpresas y encaja mejor con el
argumento "esto corre en cualquier sitio con Docker".

### El compromiso real

El BOE se publica seis días por semana, indefinidamente. **Si el servicio
requiere intervención manual, morirá en tres meses** — y un proyecto de
portfolio caído es peor que no tenerlo, porque el enlace del CV lleva a un 502.

Dos medidas que lo evitan:

1. **Alerta a tu Telegram privado si la ingesta falla dos días seguidos.** Es lo
   mínimo para enterarte antes que los usuarios.
2. **Plan de retirada digno.** Si algún día lo dejas: aviso en la web y en el
   canal, se archivan los canales y el contenido se queda estático. Nunca un
   dominio caído. Un cierre ordenado también dice algo bueno de ti.

## 6. Qué medir (ya no hay ingresos que contar)

- **Días consecutivos publicando sin fallo.** La métrica principal: es fiabilidad
  demostrable, y es exactamente lo que se le pide a un sistema en producción.
- Suscriptores en Telegram y Discord.
- Visitas mensuales y disposiciones más consultadas (dice qué le importa a la
  gente).
- Estrellas y forks del repositorio.
- **Menciones espontáneas** — que alguien lo comparta sin que se lo pidas es la
  señal de que resuelve algo real.

## 7. Decisión abierta: ¿repositorio público?

Público tiene más sentido para un portfolio, pero implica dos cosas:

- **Higiene de secretos impecable** desde el primer commit: `.env.example` sí,
  `.env` nunca, y revisar que el historial esté limpio antes de publicar.
- **Elegir licencia.** MIT si quieres que se use libremente; AGPL si prefieres
  que quien monte un servicio con tu código publique el suyo. Dado que existen
  competidores de pago haciendo exactamente esto, la AGPL es defendible.

## 8. Riesgos que quedan

| Riesgo | Mitigación |
|---|---|
| **Calidad de los resúmenes con MiniMax** en textos jurídicos en español | Validar con 20-30 disposiciones reales antes de publicar. Si falla, `AI_MODEL=anthropic/claude-haiku-4-5` y sigue costando poco. |
| **Abandono** | Automatización total + alerta de fallo + plan de retirada (§5). |
| **Una alucinación en un plazo o una cifra** | Enlace oficial primero, disclaimer visible, y revisión manual de muestras las primeras semanas. La confianza se pierde una sola vez. |
| **Cambio en la API del BOE** | Es un servicio de datos abiertos consolidado. Alerta si la ingesta falla. |
