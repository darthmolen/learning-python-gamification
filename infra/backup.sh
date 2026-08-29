#!/bin/sh
# PyQuest nightly backup — spec §6.9
#
#   "Nightly job: pg_dump of Postgres plus a mirror of every Gitea repository,
#    written to a dated tarball on a second disk. Thirty-day retention, with a
#    restore rehearsed once before week 3."
#
# The Journal and the son's commit history are the two artifacts this project
# cannot regenerate. Everything else here can be rebuilt from git and a compose up.
#
# Usage:   ./backup.sh [-d DESTINATION_DIR]
# Restore: ./restore.sh <tarball> --scratch   (rehearsal, non-destructive)
#
# POSIX sh. Runs under Git Bash on Windows and under any Linux shell.
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$SCRIPT_DIR"

if [ ! -f .env ]; then
  echo "backup: no .env found in $SCRIPT_DIR (copy .env.example to .env)" >&2
  exit 1
fi
set -a
. ./.env
set +a

DEST=${BACKUP_DEST:-/c/pyquest-backups}
RETENTION=${BACKUP_RETENTION_DAYS:-30}
while [ $# -gt 0 ]; do
  case "$1" in
    -d|--dest) DEST=$2; shift 2 ;;
    *) echo "backup: unknown argument '$1'" >&2; exit 2 ;;
  esac
done

STAMP=$(date +%Y%m%dT%H%M%S)
ARCHIVE="$DEST/pyquest-backup-$STAMP.tar.gz"
STAGE=$(mktemp -d)
# shellcheck disable=SC2064
trap "rm -rf '$STAGE'" EXIT INT TERM

mkdir -p "$DEST"

dc() { docker compose "$@"; }

echo "backup: staging in $STAGE"

# --- refuse to write a backup of a stack that is not actually up -------------
# A tarball produced from a half-started stack is worse than no tarball: it
# looks like a backup in the listing and restores to nothing.
for svc in postgres gitea; do
  health=$(docker inspect "pyquest-$svc" --format '{{.State.Health.Status}}' 2>/dev/null || echo missing)
  if [ "$health" != "healthy" ]; then
    echo "backup: ABORT - service '$svc' is '$health', not healthy." >&2
    echo "backup: bring the stack up first: docker compose up -d" >&2
    exit 1
  fi
done

# --- 1. Postgres -------------------------------------------------------------
# Roles first: a dump restored without its owning roles restores as the wrong
# owner, or not at all.
echo "backup: pg_dumpall --globals-only"
dc exec -T postgres pg_dumpall -U "$POSTGRES_USER" --globals-only > "$STAGE/globals.sql"

# Custom format (-Fc) rather than plain SQL: it is compressed, and pg_restore
# can restore it selectively and into a differently-named database, which is
# exactly what the scratch rehearsal in restore.sh needs.
echo "backup: pg_dump $POSTGRES_DB (progress - the Journal lives here)"
dc exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$STAGE/$POSTGRES_DB.dump"

echo "backup: pg_dump $GITEA_DB_NAME (gitea metadata)"
dc exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$GITEA_DB_NAME" -Fc > "$STAGE/$GITEA_DB_NAME.dump"

# --- 2. A mirror of every Gitea repository ----------------------------------
# `git clone --mirror` rather than a copy of the volume. A mirror is a real,
# self-contained git repository: it can be inspected, cloned from, and verified
# with `git log` without Gitea running or even installed. That property is what
# makes the restore rehearsal meaningful.
echo "backup: mirroring gitea repositories"
# --user git, not root. The gitea CLI refuses to run as root outright, and git
# rejects operations on repositories it does not own ("dubious ownership"), so
# a root mirror silently produces nothing. The repositories are owned by git.
dc exec -T --user git gitea sh -c '
  set -eu
  rm -rf /tmp/pyquest-mirror
  mkdir -p /tmp/pyquest-mirror
  if [ -d /data/git/repositories ]; then
    cd /data/git/repositories
    for repo in */*.git; do
      [ -d "$repo" ] || continue
      mkdir -p "/tmp/pyquest-mirror/$(dirname "$repo")"
      git clone --quiet --mirror "/data/git/repositories/$repo" "/tmp/pyquest-mirror/$repo" >&2
      echo "$repo" >&2
    done
  fi
  tar -cf - -C /tmp/pyquest-mirror .
' > "$STAGE/gitea-repositories.tar"

REPO_COUNT=$(tar -tf "$STAGE/gitea-repositories.tar" 2>/dev/null \
              | sed -n 's|^\./\([^/]*/[^/]*\.git\)/.*|\1|p' | sort -u | wc -l | tr -d ' ')

# --- 3. Manifest -------------------------------------------------------------
cat > "$STAGE/MANIFEST" <<EOF
pyquest-backup
created_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)
stamp=$STAMP
progress_db=$POSTGRES_DB
gitea_db=$GITEA_DB_NAME
repositories=$REPO_COUNT
postgres_image=$(docker inspect pyquest-postgres --format '{{.Config.Image}}')
gitea_image=$(docker inspect pyquest-gitea --format '{{.Config.Image}}')
EOF

# --- 4. Dated tarball --------------------------------------------------------
tar -czf "$ARCHIVE" -C "$STAGE" .

# --- 5. Prove the tarball is readable before claiming success ----------------
if ! tar -tzf "$ARCHIVE" >/dev/null 2>&1; then
  echo "backup: FAILED - $ARCHIVE is not a readable tarball" >&2
  rm -f "$ARCHIVE"
  exit 1
fi

# --- 6. Retention ------------------------------------------------------------
PRUNED=0
for old in "$DEST"/pyquest-backup-*.tar.gz; do
  [ -f "$old" ] || continue
  if [ -n "$(find "$old" -mtime "+$RETENTION" 2>/dev/null)" ]; then
    rm -f "$old"
    PRUNED=$((PRUNED + 1))
  fi
done

SIZE=$(du -h "$ARCHIVE" | cut -f1)
echo "backup: OK  $ARCHIVE  ($SIZE, $REPO_COUNT repositories, pruned $PRUNED older than ${RETENTION}d)"
