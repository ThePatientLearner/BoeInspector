#!/usr/bin/env bash
#
# Arranque del monolito como servicio (lo invoca el LaunchAgent
# com.agenteboe.monolith). No lo ejecutes a mano para desarrollar: para eso
# está `npm run dev`, que recarga en caliente.
#
# Se ocupa de la dependencia que el monolito no puede resolver por su cuenta:
# Postgres vive en Docker, y tras un reinicio del Mac puede que Docker Desktop
# ni siquiera esté arrancado.
#
set -euo pipefail

cd "$(dirname "$0")/.."

log() { echo "[$(date '+%H:%M:%S')] $*"; }

# ── 0. Herramientas al alcance ───────────────────────────────────
# launchd arranca con un PATH mínimo. Si falta el CLI de Docker, `docker info`
# fallaría por "command not found" y lo confundiríamos con "Docker apagado",
# entrando en un bucle de esperas de 3 minutos. Mejor decirlo claro.
for cmd in docker npm; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    log "ERROR: '$cmd' no está en el PATH ($PATH)"
    log "Añádelo a EnvironmentVariables/PATH en el .plist del LaunchAgent"
    exit 1
  fi
done

# ── 1. Docker en marcha ──────────────────────────────────────────
if ! docker info >/dev/null 2>&1; then
  log "Docker no responde; arrancando Docker Desktop…"
  open -a Docker || log "No se pudo abrir Docker Desktop"

  # Docker Desktop tarda entre 20 y 60 s en estar operativo tras un arranque
  # en frío. Si se agota la espera salimos con error: launchd reintentará.
  for _ in $(seq 1 90); do
    if docker info >/dev/null 2>&1; then break; fi
    sleep 2
  done

  if ! docker info >/dev/null 2>&1; then
    log "Docker sigue sin responder tras 3 min; launchd reintentará"
    exit 1
  fi
  log "Docker operativo"
fi

# ── 2. Postgres en marcha ────────────────────────────────────────
# El contenedor tiene `restart: unless-stopped`, así que normalmente ya estará
# arriba. Esto cubre el caso de que se parase a mano o nunca se creara.
docker compose up -d db >/dev/null 2>&1 || log "Aviso: 'docker compose up -d db' falló"

for _ in $(seq 1 30); do
  if docker compose exec -T db pg_isready -U boe >/dev/null 2>&1; then break; fi
  sleep 2
done

if ! docker compose exec -T db pg_isready -U boe >/dev/null 2>&1; then
  log "Postgres no acepta conexiones; launchd reintentará"
  exit 1
fi
log "Postgres listo"

# ── 3. El monolito ───────────────────────────────────────────────
# exec: el proceso de Node sustituye a este script, así que launchd vigila
# directamente al monolito y no a un shell intermedio.
log "Arrancando el monolito"
exec npm run serve --workspace @boe-inspector/monolith
