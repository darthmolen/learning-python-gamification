#!/bin/sh
# PyQuest infrastructure composition check.
#
# Compose files are CONFIGURATION, which test-filter-development names as an
# explicit exception to unit-test discipline. Unit-testing YAML measures
# nothing. What is worth asserting is the thing YAML cannot promise: that the
# services actually come up, that they can actually reach each other, and that
# the backup can actually be restored.
#
# This script therefore asserts, in order:
#   1. every healthcheck reaches healthy (not "starting", not "restarting")
#   2. gitea's schema really lives in the shared Postgres  (6.1)
#   3. gitea serves over its mapped host port
#   4. a real repository with a real commit can be created
#   4b. the migration job applies the progress schema, and is a no-op twice (6.1)
#   5. backup.sh produces a readable dated tarball          (6.9)
#   6. restore.sh restores it and the commit comes back     (6.9)
#
# Step 1 is not ceremony. It caught a crash-looping gitea that
# `docker compose config` had just pronounced valid.
#
# Usage:
#   ./smoke.sh            # against the current stack, creating it if needed
#   ./smoke.sh --clean    # destroy volumes first and prove a cold first boot
#
# POSIX sh. Requires Git Bash on Windows (needs sh, curl, git, tar, base64).
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$SCRIPT_DIR"

CLEAN=0
[ "${1:-}" = "--clean" ] && CLEAN=1

[ -f .env ] || { echo "smoke: no .env in $SCRIPT_DIR (cp .env.example .env)" >&2; exit 1; }
set -a
. ./.env
set +a

PASS=0
FAIL=0
ok()   { PASS=$((PASS+1)); echo "  PASS  $*"; }
bad()  { FAIL=$((FAIL+1)); echo "  FAIL  $*"; }
step() { echo; echo "=== $* ==="; }

dc() { docker compose "$@"; }
psql_super() { dc exec -T postgres psql -tAqX -U "$POSTGRES_USER" "$@" | tr -d '\r'; }

SMOKE_DEST="$SCRIPT_DIR/.smoke-backups"
GITEA_HTTP=${GITEA_HTTP_PORT:-3080}
TEST_USER=smoketest
TEST_REPO=journal-smoke
TEST_PW="smoke-$(date +%s)-Aa1x"

# =============================================================================
step "0. bring the stack up"
# =============================================================================
if [ "$CLEAN" = "1" ]; then
  echo "smoke: --clean, destroying volumes to prove a cold first boot"
  dc down -v --remove-orphans >/dev/null 2>&1 || true
fi
dc up -d

# =============================================================================
step "1. every healthcheck reaches healthy"
# =============================================================================
# Poll on health, never on a fixed sleep. A restarting container reports an
# EMPTY health string rather than "unhealthy", so treating "not healthy yet" as
# "still starting" is exactly how a crash loop gets mistaken for a slow boot.
wait_healthy() {
  svc=$1; deadline=$2; i=0
  state=unknown; health=unknown
  while [ "$i" -lt "$deadline" ]; do
    state=$(docker inspect "pyquest-$svc" --format '{{.State.Status}}' 2>/dev/null || echo missing)
    health=$(docker inspect "pyquest-$svc" --format '{{.State.Health.Status}}' 2>/dev/null || echo none)
    restarts=$(docker inspect "pyquest-$svc" --format '{{.RestartCount}}' 2>/dev/null || echo 0)
    [ "$health" = "healthy" ] && return 0
    if [ "$state" = "restarting" ] || [ "$restarts" -gt 3 ]; then
      echo "  ...   pyquest-$svc is $state after $restarts restarts - crash loop"
      docker compose logs "$svc" --tail 15 | sed 's/^/        /'
      return 1
    fi
    i=$((i+1)); sleep 5
  done
  echo "  ...   pyquest-$svc never became healthy (last: state=$state health=$health)"
  docker compose logs "$svc" --tail 15 | sed 's/^/        /'
  return 1
}

for svc in postgres gitea; do
  if wait_healthy "$svc" 36; then ok "$svc reports healthy"; else bad "$svc did not reach healthy"; fi
done

if [ "$FAIL" -gt 0 ]; then
  echo
  echo "smoke: stack did not come up; the remaining checks could not mean anything."
  dc ps
  exit 1
fi

echo
dc ps

# =============================================================================
step "2. gitea's schema lives in the shared Postgres (spec 6.1)"
# =============================================================================
DBS=$(psql_super -d postgres -c "SELECT datname FROM pg_database WHERE datname IN ('$POSTGRES_DB','$GITEA_DB_NAME') ORDER BY 1;" | tr '\n' ' ')
HAVE_GITEA=$(echo "$DBS" | grep -c "$GITEA_DB_NAME" || true)
HAVE_PROG=$(echo "$DBS" | grep -c "$POSTGRES_DB" || true)
if [ "$HAVE_GITEA" -ge 1 ] && [ "$HAVE_PROG" -ge 1 ]; then
  ok "one server holds both databases: $DBS"
else
  bad "expected both databases on one server, found: $DBS"
fi

SERVERS=$(docker ps --filter 'label=com.docker.compose.project=pyquest' --format '{{.Image}}' | grep -c postgres || true)
if [ "$SERVERS" = "1" ]; then
  ok "exactly one postgres container in the project (one server, not two)"
else
  bad "expected 1 postgres container, found $SERVERS"
fi

GITEA_TABLES=$(psql_super -d "$GITEA_DB_NAME" -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")
if [ "${GITEA_TABLES:-0}" -gt 50 ]; then
  ok "gitea migrated $GITEA_TABLES tables into the shared server"
else
  bad "gitea has only ${GITEA_TABLES:-0} tables - it is not really using this Postgres"
fi

OWNER=$(psql_super -d postgres -c "SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname='$GITEA_DB_NAME';")
if [ "$OWNER" = "$GITEA_DB_USER" ]; then
  ok "gitea database is owned by the '$GITEA_DB_USER' role, not the superuser"
else
  bad "gitea database owner is '$OWNER', expected '$GITEA_DB_USER'"
fi

# =============================================================================
step "3. gitea answers on its mapped host port"
# =============================================================================
HZ=$(curl -fsS --max-time 10 "http://localhost:$GITEA_HTTP/api/healthz" 2>/dev/null || echo '')
if echo "$HZ" | grep -q '"status": "pass"'; then
  ok "GET :$GITEA_HTTP/api/healthz -> status pass"
else
  bad "healthz did not pass over the host port: ${HZ:-<no response>}"
fi
if echo "$HZ" | grep -q 'database:ping'; then
  ok "healthz reports on gitea's own database ping"
else
  bad "healthz did not report a database ping"
fi

# =============================================================================
step "4. create a real repository with a real commit"
# =============================================================================
# A backup is only meaningful if there is history to lose. This stands in for
# a learner's repository (spec 6.4 and 7).
# --user git, not root: the gitea CLI hard-refuses to run as root, and
# `docker compose exec` defaults to root. Swallowing that error into a cheerful
# "already exists, reusing" is how this check silently tested nothing.
# Deliberately NOT --admin. A normal user can create its own repositories, which
# is all this needs, and Gitea refuses to delete the last admin account -- so an
# admin test user is one the cleanup step cannot remove.
CREATE_OUT=$(dc exec -T --user git gitea gitea admin user create \
     --username "$TEST_USER" --password "$TEST_PW" --email "$TEST_USER@localhost" \
     --must-change-password=false 2>&1) || true
if echo "$CREATE_OUT" | grep -qi 'already exist'; then
  echo "  ...   user $TEST_USER already exists, reusing"
elif echo "$CREATE_OUT" | grep -qiE '\[F\]|error|cannot'; then
  bad "gitea admin user create failed: $(echo "$CREATE_OUT" | tail -1)"
fi

TOKEN=$(dc exec -T --user git gitea gitea admin user generate-access-token \
          --username "$TEST_USER" --token-name "smoke-$(date +%s)" \
          --scopes write:repository,write:user --raw 2>/dev/null | tr -d '\r\n ')

SENTINEL=""
if [ -z "$TOKEN" ]; then
  bad "could not mint a gitea access token"
else
  ok "created user '$TEST_USER' and minted an access token"
  API="http://localhost:$GITEA_HTTP/api/v1"
  AUTH="Authorization: token $TOKEN"

  curl -fsS -X DELETE -H "$AUTH" "$API/repos/$TEST_USER/$TEST_REPO" >/dev/null 2>&1 || true
  if curl -fsS -X POST -H "$AUTH" -H 'Content-Type: application/json' \
       -d "{\"name\":\"$TEST_REPO\",\"auto_init\":true,\"default_branch\":\"main\"}" \
       "$API/user/repos" >/dev/null 2>&1; then
    ok "created repository $TEST_USER/$TEST_REPO"
  else
    bad "could not create the test repository"
  fi

  # A second commit carrying a sentinel we can hunt for after the restore.
  SENTINEL="journal-entry-$(date +%s)"
  B64=$(printf 'The Journal, entry one. %s\n' "$SENTINEL" | base64 | tr -d '\r\n')
  if curl -fsS -X POST -H "$AUTH" -H 'Content-Type: application/json' \
       -d "{\"content\":\"$B64\",\"message\":\"$SENTINEL\",\"branch\":\"main\"}" \
       "$API/repos/$TEST_USER/$TEST_REPO/contents/journal.md" >/dev/null 2>&1; then
    ok "committed journal.md with sentinel $SENTINEL"
  else
    bad "could not commit to the test repository"
    SENTINEL=""
  fi

  # The container path is wrapped in `sh -c` on purpose. Git Bash on Windows
  # rewrites any bare argument that looks like an absolute POSIX path into a
  # Windows one, so a plain --git-dir=/data/... arrives inside the container as
  # "C:/Program Files/Git/data/..." and git reports "not a git repository".
  # Inside a quoted sh -c body the path is just string data and survives intact.
  BARE_COMMITS=$(dc exec -T --user git gitea sh -c \
                    "git --git-dir=/data/git/repositories/$TEST_USER/$TEST_REPO.git rev-list --all --count" \
                    2>/dev/null | tr -d '\r ')
  if [ "${BARE_COMMITS:-0}" -ge 2 ]; then
    ok "bare repo on disk has $BARE_COMMITS commits"
  else
    bad "bare repo has ${BARE_COMMITS:-0} commits, expected at least 2"
  fi
fi

# =============================================================================
step "4b. the migration job applies the progress schema (spec 6.1)"
# =============================================================================
# Migrations run as a job, not as a service: it runs to completion and exits.
# The two things worth asserting are the two that YAML cannot promise -- that it
# actually applies the schema against the real container, and that running it a
# second time does nothing. Forward-only migrations are safe to re-run only if
# the ledger says so, and a ledger nobody has watched work is a hope.
MIGRATE_1=$(dc --profile migrate run --rm migrate 2>&1) || true
if echo "$MIGRATE_1" | grep -qE 'migrate: (applied|already up to date)'; then
  ok "the migrate job ran to completion"
else
  bad "the migrate job did not report applying anything"
  echo "$MIGRATE_1" | tail -10 | sed 's/^/        /'
fi

MIGRATE_2=$(dc --profile migrate run --rm migrate 2>&1) || true
if echo "$MIGRATE_2" | grep -q 'migrate: already up to date'; then
  ok "running it again is a no-op - the schema_migrations ledger is doing its job"
else
  bad "the second run was not a no-op; migrations are not idempotent"
  echo "$MIGRATE_2" | tail -10 | sed 's/^/        /'
fi

# Every migration on disk is recorded. A count that lags is a migration that was
# skipped, which is the failure that shows up as a missing column much later.
ON_DISK=$(find ../pyquest/packages/db/migrations -name '*.sql' | wc -l | tr -d ' ')
RECORDED=$(psql_super -d "$POSTGRES_DB" -c 'SELECT count(*) FROM schema_migrations;' 2>/dev/null || echo 0)
if [ "${RECORDED:-0}" = "$ON_DISK" ]; then
  ok "all $ON_DISK migrations are recorded in schema_migrations"
else
  bad "$ON_DISK migrations on disk, ${RECORDED:-0} recorded"
fi

# The tables themselves, named rather than counted: a count passes while the one
# table you needed is missing.
MISSING=""
for t in players player_roles campaign quest_medals attempts datamines \
         concept_reviews forced_reviews journal_entries sessions bounties runner_jobs; do
  HAVE=$(psql_super -d "$POSTGRES_DB" -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='$t';")
  [ "${HAVE:-0}" = "1" ] || MISSING="$MISSING $t"
done
if [ -z "$MISSING" ]; then
  ok "every progress table exists, and there is no quests table among them (6.7)"
else
  bad "missing tables:$MISSING"
fi

# Content stays in git. If a table ever appears here holding curriculum, 6.7 has
# been crossed and this is the check that says so.
CONTENT_TABLES=$(psql_super -d "$POSTGRES_DB" -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('quests','areas','concepts');")
if [ "${CONTENT_TABLES:-0}" = "0" ]; then
  ok "no content tables in Postgres - content lives in git (6.7)"
else
  bad "found $CONTENT_TABLES content table(s) in the progress database"
fi

# =============================================================================
step "4c. seed the progress database with real Journal rows"
# =============================================================================
# 6.9 names the Journal as one of the two artifacts this project cannot
# regenerate, and the Journal lives in Postgres. So put real rows -- in the real
# schema, not a stand-in -- through the round trip.
#
# The sentinel is the commit sha, because that is the column a Journal entry has
# that can carry one. It is deleted at the end.
JOURNAL_SENTINEL=$(printf '%s' "$(date +%s)" | sha1sum 2>/dev/null | cut -c1-40)
SMOKE_HANDLE="smoke-$(date +%s)"
if [ -n "$JOURNAL_SENTINEL" ] && dc exec -T postgres psql -v ON_ERROR_STOP=1 -qX -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
     -c "INSERT INTO players (handle, display_name) VALUES ('$SMOKE_HANDLE', 'Smoke Test');" \
     -c "INSERT INTO player_roles (player_id, role) SELECT id, 'player' FROM players WHERE handle='$SMOKE_HANDLE';" \
     -c "INSERT INTO journal_entries (player_id, session_date, commit_sha, xp_awarded) SELECT id, current_date, '$JOURNAL_SENTINEL', 10 FROM players WHERE handle='$SMOKE_HANDLE';" \
     -c "INSERT INTO quest_medals (player_id, quest_id, medal, earned_at, xp_awarded) SELECT id, 'a0-hello-world', 'cleared', current_date, 12 FROM players WHERE handle='$SMOKE_HANDLE';" \
     -c "INSERT INTO attempts (player_id, quest_id, passed) SELECT id, 'a0-hello-world', false FROM players WHERE handle='$SMOKE_HANDLE';" \
     >/dev/null 2>&1; then
  ok "seeded a player, a Journal entry, a medal and a scar into the real schema"
else
  bad "could not seed the progress database"
  JOURNAL_SENTINEL=""
fi

# =============================================================================
step "5. backup.sh produces a readable dated tarball (spec 6.9)"
# =============================================================================
rm -rf "$SMOKE_DEST"; mkdir -p "$SMOKE_DEST"
if ./backup.sh -d "$SMOKE_DEST"; then ok "backup.sh exited 0"; else bad "backup.sh failed"; fi

ARCHIVE=$(ls -1t "$SMOKE_DEST"/pyquest-backup-*.tar.gz 2>/dev/null | head -1 || true)
if [ -n "$ARCHIVE" ]; then
  ok "dated tarball written: $(basename "$ARCHIVE")"
  for member in MANIFEST "$POSTGRES_DB.dump" "$GITEA_DB_NAME.dump" gitea-repositories.tar globals.sql; do
    if tar -tzf "$ARCHIVE" | sed 's|^\./||' | grep -qx "$member"; then
      ok "tarball contains $member"
    else
      bad "tarball is MISSING $member"
    fi
  done
else
  bad "no tarball produced"
fi

# =============================================================================
step "6. restore.sh restores it, and the commit comes back (spec 6.9)"
# =============================================================================
if [ -n "${ARCHIVE:-}" ]; then
  REHEARSAL=$(./restore.sh "$ARCHIVE" --scratch 2>&1) || true
  echo "$REHEARSAL" | sed 's/^/  | /'

  if echo "$REHEARSAL" | grep -q 'SCRATCH REHEARSAL COMPLETE'; then
    ok "restore.sh completed the scratch rehearsal"
  else
    bad "restore.sh did not complete"
  fi

  # The assertions that matter: the data came BACK, into databases that did not
  # exist a moment ago.
  SCRATCH_REPOS=$(psql_super -d "${GITEA_DB_NAME}_scratch" -c 'SELECT count(*) FROM repository;' 2>/dev/null || echo 0)
  if [ "${SCRATCH_REPOS:-0}" -ge 1 ]; then
    ok "restored gitea db knows about $SCRATCH_REPOS repositories"
  else
    bad "restored gitea db has no repositories"
  fi

  SCRATCH_USER=$(psql_super -d "${GITEA_DB_NAME}_scratch" -c "SELECT count(*) FROM \"user\" WHERE lower_name='$TEST_USER';" 2>/dev/null || echo 0)
  if [ "${SCRATCH_USER:-0}" = "1" ]; then
    ok "restored gitea db contains the '$TEST_USER' account"
  else
    bad "restored gitea db lost the '$TEST_USER' account"
  fi

  if echo "$REHEARSAL" | grep -qE "$TEST_REPO\.git -> [1-9]"; then
    ok "restored repository mirror replays its commit history"
  else
    bad "restored mirror has no commits - the history did NOT survive"
  fi

  if [ -n "$SENTINEL" ]; then
    if echo "$REHEARSAL" | grep -q "$SENTINEL"; then
      ok "the exact commit '$SENTINEL' came back out of the tarball"
    else
      bad "sentinel commit '$SENTINEL' did not survive the round trip"
    fi
  fi

  # The progress-database half of the round trip, asserted on the actual row
  # contents rather than on a table count.
  if [ -n "$JOURNAL_SENTINEL" ]; then
    # The schema came back too, ledger and all: a dump that restores the rows but
    # not the migration history is one nobody can migrate forward afterwards.
    SCRATCH_MIGRATIONS=$(psql_super -d "${POSTGRES_DB}_scratch" -c 'SELECT count(*) FROM schema_migrations;' 2>/dev/null || echo 0)
    if [ "${SCRATCH_MIGRATIONS:-0}" = "$ON_DISK" ]; then
      ok "restored progress db carries all $ON_DISK migration records"
    else
      bad "restored progress db has ${SCRATCH_MIGRATIONS:-0} migration records, expected $ON_DISK"
    fi

    GOT=$(psql_super -d "${POSTGRES_DB}_scratch" -c "SELECT commit_sha FROM journal_entries WHERE commit_sha='$JOURNAL_SENTINEL';" 2>/dev/null || echo '')
    if [ "$GOT" = "$JOURNAL_SENTINEL" ]; then
      ok "the exact Journal entry came back: '$GOT'"
    else
      bad "Journal entry did not survive the round trip (got: '${GOT:-<nothing>}')"
    fi

    # The constraints have to survive the dump as well. A restored database that
    # accepts a duplicate medal is not the same database, however equal the rows
    # look, and this is the cheapest possible proof that the keys came back.
    DUP=$(dc exec -T postgres psql -qX -U "$POSTGRES_USER" -d "${POSTGRES_DB}_scratch" \
            -c "INSERT INTO quest_medals (player_id, quest_id, medal, earned_at, xp_awarded) SELECT id, 'a0-hello-world', 'cleared', current_date, 12 FROM players WHERE handle='$SMOKE_HANDLE';" 2>&1 || true)
    if echo "$DUP" | grep -q 'duplicate key'; then
      ok "the restored schema still refuses a second medal for the same quest (6.2)"
    else
      bad "the restored database accepted a duplicate medal - the keys did not survive"
    fi
  fi

  ./restore.sh --drop-scratch >/dev/null 2>&1 || true
fi

# =============================================================================
step "7. clean up after ourselves"
# =============================================================================
# A check that leaves seeded rows and a live admin account behind is a check with
# side effects. Both go.
#
# The schema itself STAYS. It is the real progress schema now rather than a
# stand-in, and dropping it would undo the migration job this script just ran.
# Only the rows this run wrote are removed, and they are removed in dependency
# order because the scars deliberately have no ON DELETE CASCADE.
if [ -n "${SMOKE_HANDLE:-}" ]; then
  dc exec -T postgres psql -qX -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
     -c "DELETE FROM attempts WHERE player_id IN (SELECT id FROM players WHERE handle='$SMOKE_HANDLE');" \
     -c "DELETE FROM players WHERE handle='$SMOKE_HANDLE';" >/dev/null 2>&1 || true

  LEFT=$(psql_super -d "$POSTGRES_DB" -c "SELECT count(*) FROM players WHERE handle='$SMOKE_HANDLE';" 2>/dev/null || echo '?')
  if [ "$LEFT" = "0" ]; then
    ok "removed the seeded progress rows, leaving the schema in place"
  else
    bad "seeded player '$SMOKE_HANDLE' is still present - delete it by hand"
  fi
fi

if [ -n "${TOKEN:-}" ]; then
  curl -fsS -X DELETE -H "Authorization: token $TOKEN" \
       "http://localhost:$GITEA_HTTP/api/v1/repos/$TEST_USER/$TEST_REPO" >/dev/null 2>&1 || true
fi
dc exec -T --user git gitea gitea admin user delete --username "$TEST_USER" --purge >/dev/null 2>&1 || true

LEFTOVER=$(psql_super -d "$GITEA_DB_NAME" -c "SELECT count(*) FROM \"user\" WHERE lower_name='$TEST_USER';" 2>/dev/null || echo '?')
if [ "$LEFTOVER" = "0" ]; then
  ok "removed the '$TEST_USER' account and its repository"
else
  bad "the '$TEST_USER' account is still present - delete it by hand"
fi

# =============================================================================
echo
echo "=================================================="
echo "  smoke: $PASS passed, $FAIL failed"
echo "=================================================="
rm -rf "$SMOKE_DEST"
[ "$FAIL" -eq 0 ] || exit 1
