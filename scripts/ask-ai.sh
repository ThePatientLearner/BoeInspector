#!/usr/bin/env bash
#
# Pregunta suelta a la IA configurada en .env, desde la terminal.
#
#   ./scripts/ask-ai.sh "resume la Ley 40/2015 en tres líneas"
#   cat texto.txt | ./scripts/ask-ai.sh "resume esto"
#   AI_MODEL=MiniMax-M3 ./scripts/ask-ai.sh "hola"     # probar otro modelo
#
# Es el mismo endpoint que usa el monolito: sirve para experimentar con
# prompts o comprobar que la clave funciona, sin arrancar nada.
#
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "No existe .env. Cópialo de la plantilla:  cp .env.example .env" >&2
  exit 1
fi

# Leemos las variables con grep en vez de 'source .env': el valor de
# CRON_SCHEDULE contiene asteriscos que la shell expandiría como comodines.
read_env() { grep -E "^$1=" .env | head -1 | cut -d= -f2- | tr -d '"'; }

BASE_URL="${AI_BASE_URL:-$(read_env AI_BASE_URL)}"
MODEL="${AI_MODEL:-$(read_env AI_MODEL)}"
API_KEY="$(read_env AI_API_KEY)"

if [[ -z "$API_KEY" ]]; then
  echo "AI_API_KEY está vacía en .env" >&2
  exit 1
fi

PROMPT="${1:-}"
# Si llega texto por una tubería, se añade debajo de la instrucción.
if [[ ! -t 0 ]]; then
  PROMPT="$PROMPT"$'\n\n'"$(cat)"
fi

if [[ -z "$PROMPT" ]]; then
  echo "Uso: $0 \"tu pregunta\"   (o pásale texto por una tubería)" >&2
  exit 1
fi

echo "· modelo: $MODEL" >&2

# python3 construye el JSON para que las comillas y saltos de línea del
# prompt se escapen bien, y luego lee la respuesta.
BODY=$(PROMPT="$PROMPT" MODEL="$MODEL" python3 -c '
import json, os
print(json.dumps({
    "model": os.environ["MODEL"],
    "messages": [{"role": "user", "content": os.environ["PROMPT"]}],
    "max_tokens": 8000,
}))
')

curl -sS -X POST "$BASE_URL/text/chatcompletion_v2" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$BODY" |
  python3 -c '
import json, sys

data = json.load(sys.stdin)

# MiniMax responde 200 aunque haya fallado: el error real va en base_resp.
resp = data.get("base_resp", {})
code = resp.get("status_code", 0)
if code != 0:
    print("ERROR %s: %s" % (code, resp.get("status_msg")), file=sys.stderr)
    sys.exit(1)

choices = data.get("choices") or []
if not choices:
    print("La respuesta no traía contenido.", file=sys.stderr)
    sys.exit(1)

print(choices[0].get("message", {}).get("content", ""))

usage = data.get("usage", {})
print(
    "\n· %s tokens de entrada, %s de salida"
    % (usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0)),
    file=sys.stderr,
)
'
