#!/usr/bin/env bash
#
# token.sh - sign in as the DM and print a bearer token, and nothing else.
#
# §6.4 puts the api on the parent's machine, so every route worth checking by hand is behind
# `authenticate` and answers 401 to curl. That 401 is also what an unknown path answers, because
# auth runs before routing — so without a token you cannot tell "the route is missing" from "you
# are not signed in", which is exactly the question you want answered after a bounce.
#
#   TOKEN=$(infra/token.sh)
#   curl -s -H "authorization: Bearer $TOKEN" http://localhost:3081/api/medals
#
# **It prints the token and nothing else on stdout.** Every message goes to stderr, so the command
# substitution above stays clean and a failure cannot be mistaken for a credential.
#
# The password is read and posted; it is never echoed, never put in a URL, and never written to a
# file. `.env` is gitignored and stays that way — this script reads it, it does not copy it.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${PYQUEST_ENV:-$ROOT/.env}"
API="${API_URL:-http://localhost:3081}"

say() { printf '%s\n' "$*" >&2; }

[ -f "$ENV_FILE" ] || { say "[FAIL] no .env at $ENV_FILE"; exit 1; }

# Parsed rather than sourced. A `.env` is data, and `source` would execute whatever is in it —
# `$(rm -rf ...)` in a value is a real shell command at that point. The trailing `tr -d` strips a
# CR, because this file is edited on Windows and a token request with a carriage return in the
# handle fails with a message about the handle rather than about line endings.
value_of() {
  grep -m1 -E "^[[:space:]]*$1[[:space:]]*=" "$ENV_FILE" \
    | cut -d= -f2- \
    | sed -E 's/^[[:space:]]*//; s/[[:space:]]*$//; s/^"(.*)"$/\1/; s/^'"'"'(.*)'"'"'$/\1/' \
    | tr -d '\r'
}

DM_USER="$(value_of dm_user || true)"
DM_PW="$(value_of dm_pw || true)"

[ -n "$DM_USER" ] || { say "[FAIL] dm_user is not set in $ENV_FILE"; exit 1; }
# Reported as "not set" without saying what was looked for beyond the key name. The value never
# appears in output, an error message, or a shell trace.
[ -n "$DM_PW" ] || { say "[FAIL] dm_pw is not set in $ENV_FILE"; exit 1; }

# The body is built by a JSON encoder rather than string interpolation: a password containing a
# quote or a backslash would otherwise produce malformed JSON and a 400 that looks like a wrong
# password. It arrives on stdin so it is never an argument, and so never visible in `ps`.
BODY="$(DM_USER="$DM_USER" DM_PW="$DM_PW" node -e \
  'process.stdout.write(JSON.stringify({handle: process.env.DM_USER, password: process.env.DM_PW}))')"

RESPONSE="$(printf '%s' "$BODY" | curl -sS -X POST "$API/api/session" \
  -H 'content-type: application/json' \
  -H 'accept: application/json' \
  --data-binary @- \
  -w '\n%{http_code}')" || { say "[FAIL] could not reach $API — is the stack up?"; exit 1; }

STATUS="$(printf '%s' "$RESPONSE" | tail -n1)"
PAYLOAD="$(printf '%s' "$RESPONSE" | sed '$d')"

if [ "$STATUS" != "200" ]; then
  say "[FAIL] $API/api/session answered $STATUS"
  # The api's own message, which says whether the handle is unknown, the password is wrong, or the
  # household has not been bootstrapped. It never contains the credential.
  printf '%s\n' "$PAYLOAD" >&2
  exit 1
fi

TOKEN="$(printf '%s' "$PAYLOAD" | node -e \
  'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{process.stdout.write(JSON.parse(d).token??"")}catch{process.stdout.write("")}})')"

[ -n "$TOKEN" ] || { say "[FAIL] signed in, but the response carried no token"; exit 1; }

say "[OK] signed in as $DM_USER"
printf '%s\n' "$TOKEN"
