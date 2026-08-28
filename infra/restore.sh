#!/bin/sh
# PyQuest restore — spec §6.9 ("a restore rehearsed once before week 3")
#
# Two modes, and the safe one is the default:
#
#   ./restore.sh <tarball> --scratch
#       Restores into throwaway databases (<db>_scratch) and unpacks the
#       repository mirrors into a temp directory, then verifies both. Touches
#       nothing live. THIS IS THE REHEARSAL. Run it monthly.
#
#   ./restore.sh <tarball> --live
#       The real thing, for the day the disk dies. DESTRUCTIVE: drops and
#       recreates the progress and gitea databases and replaces the repository
#       tree. Requires typing the confirmation phrase.
#
# A backup that has never been restored is a hope, not a backup.
#
# POSIX sh. Runs under Git Bash on Windows and under any Linux shell.
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$SCRIPT_DIR"

usage() { echo "usage: $0 <tarball> [--scratch|--live]
       $0 --drop-scratch" >&2; exit 2; }

# --drop-scratch cleans up after a rehearsal and needs no tarball.
if [ "${1:-}" = "--drop-scratch" ]; then
  [ -f .env ] || { echo "restore: no .env in $SCRIPT_DIR" >&2; exit 1; }
  set -a; . ./.env; set +a
  for db in "${POSTGRES_DB}_scratch" "${GITEA_DB_NAME}_scratch"; do
    echo "restore: dropping scratch database '$db'"
    docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER"       -d postgres -c "DROP DATABASE IF EXISTS \"$db\";" >/dev/null
  done
  echo "restore: scratch databases dropped"
  exit 0
fi

ARCHIVE=${1:-}
MODE=${2:---scratch}
[ -n "$ARCHIVE" ] || usage
[ -f "$ARCHIVE" ] || { echo "restore: no such tarball: $ARCHIVE" >&2; exit 1; }
case "$MODE" in --scratch|--live) ;; *) usage ;; esac

[ -f .env ] || { echo "restore: no .env in $SCRIPT_DIR" >&2; exit 1; }
set -a
. ./.env
set +a

dc() { docker compose "$@"; }
psql_super() { dc exec -T postgres psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres "$@"; }

WORK=$(mktemp -d)
# shellcheck disable=SC2064
trap "rm -rf '$WORK'" EXIT INT TERM

echo "restore: unpacking $ARCHIVE"
tar -xzf "$ARCHIVE" -C "$WORK"
[ -f "$WORK/MANIFEST" ] || { echo "restore: MANIFEST missing - not a pyquest backup" >&2; exit 1; }
echo "restore: manifest --"
sed 's/^/  /' "$WORK/MANIFEST"

if [ "$MODE" = "--scratch" ]; then
  TARGET_PROGRESS="${POSTGRES_DB}_scratch"
  TARGET_GITEA="${GITEA_DB_NAME}_scratch"
else
  TARGET_PROGRESS="$POSTGRES_DB"
  TARGET_GITEA="$GITEA_DB_NAME"
  cat >&2 <<EOF

  !! LIVE RESTORE. This DROPS the '$POSTGRES_DB' and '$GITEA_DB_NAME'
  !! databases and REPLACES every Gitea repository with the tarball's copy.
  !! Anything written since $ARCHIVE was taken is lost.

EOF
  printf 'Type exactly: restore the campaign\n> ' >&2
  read -r CONFIRM
  [ "$CONFIRM" = "restore the campaign" ] || { echo "restore: aborted" >&2; exit 1; }
  echo "restore: stopping gitea so it cannot write during the restore"
  dc stop gitea >/dev/null
fi

# --- databases ---------------------------------------------------------------
# The dumps are custom-format, so pg_restore can drop them into a database with
# a different name. That is the whole reason the scratch rehearsal is possible
# without a second Postgres server.
restore_db() {
  src=$1; target=$2
  echo "restore: $src.dump -> database '$target'"
  psql_super -c "DROP DATABASE IF EXISTS \"$target\";" >/dev/null
  psql_super -c "CREATE DATABASE \"$target\" OWNER \"$POSTGRES_USER\";" >/dev/null
  # --no-owner/--no-acl: the scratch copy is owned by the superuser rather than
  # by roles that may not exist yet. For --live the globals.sql above has
  # already recreated the roles.
  dc exec -T postgres pg_restore -U "$POSTGRES_USER" -d "$target" \
      --no-owner --no-acl --exit-on-error < "$WORK/$src.dump"
}

if [ "$MODE" = "--live" ]; then
  echo "restore: replaying role definitions (globals.sql)"
  dc exec -T postgres psql -U "$POSTGRES_USER" -d postgres < "$WORK/globals.sql" >/dev/null 2>&1 || true
fi

restore_db "$POSTGRES_DB" "$TARGET_PROGRESS"
restore_db "$GITEA_DB_NAME" "$TARGET_GITEA"

# --- repositories ------------------------------------------------------------
if [ "$MODE" = "--live" ]; then
  echo "restore: replacing /data/git/repositories from the mirrors"
  dc start gitea >/dev/null
  # wait for the container to be running again before exec
  i=0
  while [ "$(docker inspect pyquest-gitea --format '{{.State.Running}}' 2>/dev/null)" != "true" ]; do
    i=$((i+1)); [ "$i" -gt 30 ] && { echo "restore: gitea did not restart" >&2; exit 1; }
    sleep 2
  done
  dc exec -T gitea sh -c '
    set -eu
    rm -rf /tmp/pyquest-restore && mkdir -p /tmp/pyquest-restore
    tar -xf - -C /tmp/pyquest-restore
    rm -rf /data/git/repositories
    mkdir -p /data/git/repositories
    cp -a /tmp/pyquest-restore/. /data/git/repositories/
    chown -R git:git /data/git/repositories
  ' < "$WORK/gitea-repositories.tar"
  RESTORED_REPOS=/data/git/repositories
  echo "restore: repositories replaced in the live volume"
else
  RESTORED_REPOS="$WORK/repos"
  mkdir -p "$RESTORED_REPOS"
  tar -xf "$WORK/gitea-repositories.tar" -C "$RESTORED_REPOS"
fi

# --- verification ------------------------------------------------------------
# Restoring without checking is the same mistake as backing up without
# restoring, one level up. Assert, do not assume.
echo
echo "restore: ---- verification ----"

GITEA_USERS=$(dc exec -T postgres psql -U "$POSTGRES_USER" -d "$TARGET_GITEA" -tAc \
              'SELECT count(*) FROM "user";' | tr -d '\r ')
GITEA_REPOS=$(dc exec -T postgres psql -U "$POSTGRES_USER" -d "$TARGET_GITEA" -tAc \
              'SELECT count(*) FROM repository;' | tr -d '\r ')
PROGRESS_TABLES=$(dc exec -T postgres psql -U "$POSTGRES_USER" -d "$TARGET_PROGRESS" -tAc \
              "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d '\r ')

echo "restore:   $TARGET_GITEA     -> $GITEA_USERS users, $GITEA_REPOS repositories"
echo "restore:   $TARGET_PROGRESS  -> $PROGRESS_TABLES public tables"

if [ "$MODE" = "--scratch" ]; then
  MIRRORS=0
  COMMITS=0
  for repo in "$RESTORED_REPOS"/*/*.git; do
    [ -d "$repo" ] || continue
    MIRRORS=$((MIRRORS + 1))
    n=$(git --git-dir="$repo" rev-list --all --count 2>/dev/null || echo 0)
    COMMITS=$((COMMITS + n))
    echo "restore:   mirror $(basename "$(dirname "$repo")")/$(basename "$repo") -> $n commits, HEAD $(git --git-dir="$repo" log -1 --format='%h %s' 2>/dev/null || echo '(none)')"
  done
  echo "restore:   $MIRRORS repository mirrors, $COMMITS commits total"
  echo
  echo "restore: SCRATCH REHEARSAL COMPLETE."
  echo "restore: scratch databases '$TARGET_PROGRESS' and '$TARGET_GITEA' were left in place"
  echo "restore: for inspection. Drop them with:"
  echo "restore:   ./restore.sh --drop-scratch"
else
  echo
  echo "restore: LIVE RESTORE COMPLETE. Check http://localhost:${GITEA_HTTP_PORT:-3080}/"
fi
