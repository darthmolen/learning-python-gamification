#!/usr/bin/env bash
#
# The dev api — real content, real API, from source, on its own port and its own database.
#
# ## What this is for
#
# There are two other ways to run the SPA and neither answers "I changed a brief — does it look
# right?".
#
#   prod        web:3082 + api:3081, both images. Real content, but an API change needs an image
#               rebuild and a content change needs a container restart. This is the learner's.
#   app dev     `npm run dev`, answering from apps/web/src/fixtures. Hermetic, offline, correct —
#               and deliberately sparse: 7 concepts against the real 95, `iteration` left
#               undefined on purpose so the empty state is visible. Nothing about content can be
#               judged from it, and a Tome reading "2 concepts" is a stub behaving correctly.
#   dev stack   this. vite:5173 with VITE_API_LIVE -> proxy -> api from source on 3083 ->
#               pyquest_dev, with content read straight out of the repository.
#
# ## Two commands, and the split is deliberate
#
#     ./infra/dev-stack.sh                          # terminal 1 — the api (this script)
#     npm run dev:live --workspace @pyquest/web     # terminal 2 — the SPA, from pyquest/
#
# The api is the half you restart, because restarting it is how content reloads (see below). The
# vite server is the half you leave alone: it holds HMR state and the page you are looking at, and
# bouncing it every time you fix a typo in a brief would throw away the thing you were checking.
#
# ## Production stays up. That is not a preference.
#
# 3081 and 3082 stay bound to the images throughout. 3082 is the learner's front door (§6.4), and
# a dev stack that requires taking it down is a dev stack nobody runs on a weeknight. This script
# stops nothing, rebuilds nothing, and takes no production port. Bringing it up mid-practice is a
# non-event.
#
# ## The dev api writes to its own database, and this script will not let it do otherwise
#
# Signing in writes a token row. Clicking through a quest writes attempts, medals and journal
# entries. A dev api pointed at POSTGRES_DB would do content review by mutating the learner's real
# progress — and §6.7 puts progress in Postgres precisely because it is the half that cannot be
# regenerated from git. So the check below is a refusal, not a warning, and the database being
# written to is printed every single time.
#
# ## How content reloads: restart this script
#
# Ctrl-C, run it again. About three seconds. Considered and rejected:
#
#   a reload endpoint   POST /api/content/reload, dev-only. Fast, and it puts a route in the api
#                       that exists only for authors — shipped in the image, reachable in
#                       production, guarded by a flag someone has to keep correct forever.
#   a watcher           the real "edit, refresh" loop, and the most work. loadContentRoot
#                       validates, so a save mid-edit produces invalid content and the watcher has
#                       to hold the last good tree rather than serve nothing. A watcher serving
#                       stale-or-broken content during an edit is worse than both other options.
#
# Restarting the thing you were already restarting is not much worse than a watcher, and it cannot
# lie to you about what is loaded.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/.." && pwd)"

usage() {
  cat <<'USAGE'
Usage: ./infra/dev-stack.sh [--seed] [--migrate-only] [--help]

Runs the PyQuest api from source against a development database, so a content or API change
shows up in a browser refresh without an image rebuild.

  --seed          (re)seed the dev database with a throwaway household before starting
  --migrate-only  create and migrate the dev database, then stop — do not start the api
  --help          this message

Then, in a second terminal, from pyquest/:

  npm run dev:live --workspace @pyquest/web      then open http://127.0.0.1:5173

Production is untouched: 3081 and 3082 stay bound to their containers throughout.
USAGE
}

SEED=0
MIGRATE_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --seed) SEED=1 ;;
    --migrate-only) MIGRATE_ONLY=1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "dev-stack: unknown argument '$arg'" >&2; echo >&2; usage >&2; exit 2 ;;
  esac
done

# ---------------------------------------------------------------------------
# Configuration comes from infra/.env — the file Compose already reads.
#
# infra/ is the Compose project directory (infra/docker-compose.yml `include:`s the fragments
# under compose/), so this is not a new mechanism and there is no second place for these values to
# disagree. It is gitignored; infra/.env.example is the tracked template beside it.
# ---------------------------------------------------------------------------
if [[ ! -f "$HERE/.env" ]]; then
  echo "dev-stack: $HERE/.env does not exist" >&2
  echo "      fix: cp infra/.env.example infra/.env, then replace every CHANGEME" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091  # runtime configuration, deliberately not tracked
. "$HERE/.env"
set +a

require() {
  if [[ -z "${!1:-}" ]]; then
    echo "dev-stack: $1 is not set in infra/.env" >&2
    echo "      fix: see infra/.env.example, which documents it" >&2
    exit 1
  fi
}
for key in POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB POSTGRES_PORT DEV_API_PORT DEV_POSTGRES_DB; do
  require "$key"
done

# ---------------------------------------------------------------------------
# The refusals. Each of these is a mistake that would be expensive and quiet.
# ---------------------------------------------------------------------------

# The one mistake worth making impossible.
if [[ "$DEV_POSTGRES_DB" == "$POSTGRES_DB" ]]; then
  cat >&2 <<REFUSE
dev-stack: REFUSING — DEV_POSTGRES_DB and POSTGRES_DB are both '$POSTGRES_DB'.

      The dev api signs in, records attempts, awards medals and writes journal entries.
      Pointed at the production database it would do content review by mutating the
      learner's real progress, which is the one thing in this system that cannot be
      regenerated from git (§6.7).

      fix: set DEV_POSTGRES_DB=pyquest_dev in infra/.env
REFUSE
  exit 1
fi

# Production's ports are not available to borrow, and the error says so rather than failing later
# with "address in use" and letting somebody helpfully free the port.
for reserved in "${API_PORT:-3081}" "${WEB_PORT:-3082}" "${GITEA_HTTP_PORT:-3080}"; do
  if [[ "$DEV_API_PORT" == "$reserved" ]]; then
    cat >&2 <<REFUSE
dev-stack: REFUSING — DEV_API_PORT is $DEV_API_PORT, which production is using.

      3081 is the api container and 3082 is the learner's front door. Production stays
      up while the dev stack runs; that is the whole shape of this thing.

      fix: set DEV_API_PORT=3083 in infra/.env
REFUSE
    exit 1
  fi
done

# Held by something else? Say what, and stop. Never kill it — on this machine the thing holding a
# port in the 308x block is most likely production.
if command -v netstat >/dev/null 2>&1 && netstat -ano 2>/dev/null | grep -qE "[:.]$DEV_API_PORT[[:space:]].*LISTEN"; then
  echo "dev-stack: port $DEV_API_PORT is already in use." >&2
  echo >&2
  netstat -ano 2>/dev/null | grep -E "[:.]$DEV_API_PORT[[:space:]].*LISTEN" | sed 's/^/      /' >&2
  echo >&2
  echo "      If that is an older dev api, stop it and run this again. This script will not" >&2
  echo "      kill it for you: in the 308x block the likeliest holder is production." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Postgres, and the dev database inside it.
#
# `docker exec` against the running container rather than a host psql, because psql is not
# installed on this machine and the container already has one. The container name is the one
# docker-compose.yml pins.
# ---------------------------------------------------------------------------
PG_CONTAINER="${PG_CONTAINER:-pyquest-postgres}"

if ! docker exec "$PG_CONTAINER" pg_isready -U "$POSTGRES_USER" -q >/dev/null 2>&1; then
  echo "dev-stack: postgres is not answering in container '$PG_CONTAINER'." >&2
  echo "      fix: cd infra && docker compose up -d postgres" >&2
  exit 1
fi

psql_postgres() { docker exec "$PG_CONTAINER" psql -U "$POSTGRES_USER" -d postgres -tAc "$1"; }

if [[ -z "$(psql_postgres "select 1 from pg_database where datname='$DEV_POSTGRES_DB'")" ]]; then
  echo "dev-stack: creating database $DEV_POSTGRES_DB"
  docker exec "$PG_CONTAINER" createdb -U "$POSTGRES_USER" -O "$POSTGRES_USER" "$DEV_POSTGRES_DB"
fi

DEV_DATABASE_URL="postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:${POSTGRES_PORT}/${DEV_POSTGRES_DB}"

# Migrated from the host rather than through compose/migrate.yml, and it is worth saying why.
# migrate.yml is a container that has to be BUILT before it can run, and it cannot create a
# database — only migrate one that exists. This script is a host-process stack already, and
# `npm run migrate` is the same migrator reading the same DATABASE_URL. Routing half of this
# through Docker would add an image build to a script whose whole point is not needing one.
echo "dev-stack: migrating $DEV_POSTGRES_DB"
( cd "$REPO/pyquest" && DATABASE_URL="$DEV_DATABASE_URL" npm run --silent migrate --workspace @pyquest/db )

if [[ "$SEED" == "1" ]]; then
  echo "dev-stack: seeding $DEV_POSTGRES_DB with a throwaway household"
  ( cd "$REPO/pyquest" && DATABASE_URL="$DEV_DATABASE_URL" npm run --silent seed --workspace @pyquest/db )
fi

if [[ "$MIGRATE_ONLY" == "1" ]]; then
  echo "dev-stack: --migrate-only, stopping here."
  exit 0
fi

# ---------------------------------------------------------------------------
# The api, from source.
#
# The spool and workspace roots are host directories under infra/logs/, NOT the compose volume the
# runner reads. A submission made against the dev api therefore queues and is never picked up:
# the runner container cannot see this spool, by construction — it has no network and reaches the
# api only through a Docker volume. Content review and API work do not need it, and pretending
# otherwise by sharing the production spool would put dev jobs in the learner's queue.
# ---------------------------------------------------------------------------
DEV_SPOOL="$HERE/logs/dev-spool"
DEV_WORKSPACES="$HERE/logs/dev-workspaces"
mkdir -p "$DEV_SPOOL" "$DEV_WORKSPACES"

cat <<BANNER

  ────────────────────────────────────────────────────────────────────────
   PyQuest dev api — from source, reloads on restart
  ────────────────────────────────────────────────────────────────────────
   database    ${DEV_POSTGRES_DB}   (NOT ${POSTGRES_DB} — the learner's progress is untouched)
   port        127.0.0.1:${DEV_API_PORT}   (loopback only)
   content     ${REPO}   (read live from the repository)
   production  3081 and 3082 stay up, bound to their containers

   the SPA:    npm run dev:live --workspace @pyquest/web      (from pyquest/, another terminal)
   reload:     Ctrl-C and run this again — about three seconds
  ────────────────────────────────────────────────────────────────────────

BANNER

cd "$REPO/pyquest"
exec env \
  CONTENT_ROOT="$REPO" \
  DATABASE_URL="$DEV_DATABASE_URL" \
  API_PORT="$DEV_API_PORT" \
  API_HOST="127.0.0.1" \
  SPOOL_ROOT="$DEV_SPOOL" \
  WORKSPACE_ROOT="$DEV_WORKSPACES" \
  npm start --workspace @pyquest/api
