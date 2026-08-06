#!/usr/bin/env bash
# Restaura una copia de seguridad en la base de datos actual.
#
#   ./scripts/restore-db.sh backups/boe-2026-08-06-1900.sql.gz
#
# Este es el paso de la mudanza: levantas el compose en el servidor
# nuevo, copias el fichero .sql.gz y lo restauras aquí.
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Uso: $0 <fichero.sql.gz>" >&2
  exit 1
fi

DUMP="$1"
if [ ! -f "$DUMP" ]; then
  echo "No existe el fichero: $DUMP" >&2
  exit 1
fi

cd "$(dirname "$0")/.."

echo "ATENCIÓN: esto sobrescribe los datos actuales de boe_inspector."
read -r -p "¿Continuar? (escribe SI): " CONFIRM
[ "$CONFIRM" = "SI" ] || { echo "Cancelado."; exit 1; }

gunzip -c "$DUMP" | docker compose exec -T db psql -U boe -d boe_inspector

echo "Restauración completada desde $DUMP"
