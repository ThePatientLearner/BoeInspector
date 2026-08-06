#!/usr/bin/env bash
# Copia de seguridad de la base de datos.
#
#   ./scripts/backup-db.sh            → backups/boe-YYYY-MM-DD-HHMM.sql.gz
#
# Genera un volcado LÓGICO (SQL), no una copia binaria del volumen. Es lo
# que hace la base de datos portable: un fichero SQL se restaura en
# cualquier Postgres 16, en cualquier máquina y arquitectura. Copiar los
# ficheros del volumen a pelo solo funciona entre versiones idénticas.
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p backups

STAMP=$(date +%Y-%m-%d-%H%M)
OUT="backups/boe-${STAMP}.sql.gz"

docker compose exec -T db pg_dump -U boe -d boe_inspector | gzip > "$OUT"

echo "Copia creada: $OUT ($(du -h "$OUT" | cut -f1))"
echo "Restaurar en otra máquina:  ./scripts/restore-db.sh $OUT"
