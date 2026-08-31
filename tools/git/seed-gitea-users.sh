#!/bin/sh
# Seed the two Gitea accounts this campaign runs on: the DM (admin) and one player.
#
# §5.11 is Kitchen Table mode — one household, two seats, and nobody signs themselves up.
# `GITEA__service__DISABLE_REGISTRATION` is true and `INSTALL_LOCK` skips the setup wizard,
# so the *only* way an account comes into existence is the admin CLI. This script is that
# path written down, so it is not four remembered flags at 7:15pm.
#
# Idempotent on purpose. Re-running reports what already exists and creates what does not;
# it never fails because you ran it twice.
#
# Usage:
#   ./seed-gitea-users.sh                   # create anything missing, verify both logins
#   ./seed-gitea-users.sh --reset-password  # also force existing accounts back to .env
#
# POSIX sh. Requires Git Bash on Windows (needs sh, awk, curl, docker).
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
ENV_FILE="$REPO_ROOT/.env"
INFRA_DIR="$REPO_ROOT/infra"

RESET_PW=0
[ "${1:-}" = "--reset-password" ] && RESET_PW=1

PASS=0
FAIL=0
ok()   { PASS=$((PASS+1)); echo "  PASS  $*"; }
bad()  { FAIL=$((FAIL+1)); echo "  FAIL  $*"; }
skip() { echo "  SKIP  $*"; }
step() { echo; echo "=== $* ==="; }
die()  { echo "seed-gitea-users: $*" >&2; exit 1; }

# Read one key from a .env file.
#
# Deliberately NOT `. ./.env`. Two reasons, both load-bearing here:
#   1. The keys are hyphenated (`gitea-user-admin`), which is not a shell identifier, so
#      sourcing would try to RUN the line rather than assign it.
#   2. Sourcing executes whatever the file contains. A credentials file should be data.
#
# awk rather than a `while read` loop because the real file, written by a Windows editor,
# has CRLF endings and NO trailing newline. The second one is the bug: a read loop returns
# empty for the last key, which is `gitea-user1-pw` — measured, not assumed. awk reads the
# final unterminated line correctly.
#
# The sub(/\r$/) is belt-and-braces: the MSYS tools in Git Bash already strip CR on read,
# so it changes nothing today. It is here because this file is also the obvious thing to
# reuse under a shell where that is not true, and a \r inside a password fails as a wrong
# password — the least debuggable failure this script could produce.
env_get() {
  awk -v k="$1" '
    BEGIN { n = length(k) }
    substr($0, 1, n + 1) == k "=" { v = substr($0, n + 2); sub(/\r$/, "", v); print v; exit }
  ' "$2"
}

require() {
  eval "_val=\${$1}"
  [ -n "$_val" ] || die "$2 is missing or empty in $ENV_FILE"
}

dc() { (cd "$INFRA_DIR" && docker compose "$@"); }

# `--user git` is not optional: gitea refuses to run as root, and the error it gives
# ("Gitea is not supposed to be run as root") never mentions the fix.
gitea_admin() { dc exec -T --user git gitea gitea admin "$@"; }

# =============================================================================
step "0. inputs"
# =============================================================================
[ -f "$ENV_FILE" ] || die "no .env at $ENV_FILE"

ADMIN_USER=$(env_get gitea-user-admin "$ENV_FILE")
ADMIN_PW=$(env_get gitea-user-admin-pw "$ENV_FILE")
USER1=$(env_get gitea-user1 "$ENV_FILE")
USER1_PW=$(env_get gitea-user1-pw "$ENV_FILE")

require ADMIN_USER gitea-user-admin
require ADMIN_PW   gitea-user-admin-pw
require USER1      gitea-user1
require USER1_PW   gitea-user1-pw

# The whole point of the awk parser above. If this ever trips, the parser has regressed.
for _v in "$ADMIN_PW" "$USER1_PW"; do
  case $_v in
    *[[:space:]]*)
      die "a password contains whitespace or a stray carriage return - refusing to create an account whose password will not match"
      ;;
  esac
done
ok "read four keys from .env (values not printed)"

GITEA_PORT=$(env_get GITEA_HTTP_PORT "$INFRA_DIR/.env" 2>/dev/null || true)
[ -n "$GITEA_PORT" ] || GITEA_PORT=3080
BASE="http://localhost:$GITEA_PORT"
ok "gitea base url $BASE"

# =============================================================================
step "1. gitea is up"
# =============================================================================
# Checked before anything else, because every failure below looks identical when the
# container is down and none of them says so.
curl -fsS -o /dev/null --max-time 10 "$BASE/api/healthz" \
  || die "gitea is not answering on $BASE - try: (cd infra && docker compose up -d gitea)"
ok "healthz"

# =============================================================================
step "2. accounts"
# =============================================================================
TMP_ERR=$(mktemp)
trap 'rm -f "$TMP_ERR"' EXIT

# `gitea admin user list` prints a header plus one row per user; the username is field 2.
user_exists() {
  gitea_admin user list 2>/dev/null | awk -v u="$1" 'NR > 1 && $2 == u { f = 1 } END { exit !f }'
}

# Passwords are passed as argv, which is visible in `ps` while the command runs. The gitea
# CLI offers no stdin alternative. On a single-operator household host that is acceptable;
# on a shared machine it would not be.
seed_user() {
  _u=$1
  _pw=$2
  _is_admin=$3
  _label=$4

  if user_exists "$_u"; then
    if [ "$RESET_PW" = "1" ]; then
      if gitea_admin user change-password --username "$_u" --password "$_pw" --must-change-password=false >/dev/null 2>"$TMP_ERR"; then
        ok "$_label '$_u' password reset to .env"
      else
        bad "$_label '$_u' password reset failed: $(tr -d '\r' < "$TMP_ERR" | tail -n 1)"
      fi
    else
      skip "$_label '$_u' already exists (--reset-password forces its password back to .env)"
    fi
    return 0
  fi

  # --must-change-password defaults to TRUE, which drops the account into a password reset
  # screen on first login. For a player mid-session that is a dead end, so it is turned off
  # explicitly rather than left to the default.
  set -- user create --username "$_u" --email "$_u@localhost" --password "$_pw" --must-change-password=false
  if [ "$_is_admin" = "1" ]; then
    set -- "$@" --admin
  fi

  if gitea_admin "$@" >/dev/null 2>"$TMP_ERR"; then
    ok "$_label '$_u' created"
  else
    bad "$_label '$_u' could not be created: $(tr -d '\r' < "$TMP_ERR" | tail -n 1)"
  fi
}

seed_user "$ADMIN_USER" "$ADMIN_PW" 1 "dm (admin)"
seed_user "$USER1"      "$USER1_PW" 0 "player"

# =============================================================================
step "3. what proves it works"
# =============================================================================
# Creating a row is not the same as being able to log in. This is the assertion that
# actually matters: the credentials in .env authenticate against the running server.
verify_login() {
  _u=$1
  _pw=$2
  _label=$3

  if ! _got=$(curl -fsS --max-time 10 -u "$_u:$_pw" "$BASE/api/v1/user" 2>/dev/null); then
    bad "$_label '$_u' cannot authenticate - the account exists but the password does not match"
    return 0
  fi

  case $(printf '%s' "$_got" | tr -d '\r') in
    *"\"login\":\"$_u\""*) ok "$_label '$_u' authenticates" ;;
    *)                     bad "$_label '$_u' authenticated as somebody else" ;;
  esac
}

verify_login "$ADMIN_USER" "$ADMIN_PW" "dm (admin)"
verify_login "$USER1"      "$USER1_PW" "player"

# The admin flag is a separate claim from the login, and it is the one that decides whether
# the DM can provision anything else - users, keys, repositories.
if curl -fsS -o /dev/null --max-time 10 -u "$ADMIN_USER:$ADMIN_PW" "$BASE/api/v1/admin/users?limit=1"; then
  ok "dm '$ADMIN_USER' has admin rights"
else
  bad "dm '$ADMIN_USER' is not an admin - it cannot provision users, keys or repositories"
fi

# =============================================================================
step "result"
# =============================================================================
echo "  $PASS passed, $FAIL failed"
[ "$FAIL" = "0" ] || exit 1

GITEA_DOMAIN=$(env_get GITEA_DOMAIN "$INFRA_DIR/.env" 2>/dev/null || true)
[ -n "$GITEA_DOMAIN" ] || GITEA_DOMAIN=localhost

echo
echo "  Next, on each learner's own machine:"
echo "      ssh-keygen -t ed25519 -C \"pyquest-<role>\""
echo "  then paste the .pub at $BASE/user/settings/keys and check it with:"
echo "      ssh -T -p 3022 git@$GITEA_DOMAIN"
