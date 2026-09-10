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
# ## One command, or two
#
#     ./infra/dev-stack.sh --with-spa               # both, stopped together on Ctrl-C
#
# or, in two terminals:
#
#     ./infra/dev-stack.sh                          # terminal 1 — the api (this script)
#     npm run dev:live --workspace @pyquest/web     # terminal 2 — the SPA, from pyquest/
#
# **The two-terminal form is still the better one for a long session**, and `--with-spa` is a
# convenience rather than a correction. The api is the half you restart, because restarting it is
# how a manifest change reloads (see below); the vite server is the half you want left alone,
# because it is holding HMR state and the page you are looking at. Under `--with-spa` every api
# restart bounces vite too and you lose that page.
#
# Which is worth it depends on the session. Dipping in to check one screen: one command. An
# afternoon of moving quests between areas: two terminals, and leave vite up.
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
# Ctrl-C, run it again. About four seconds. Considered and rejected:
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
Usage: ./infra/dev-stack.sh [--with-spa] [--seed] [--migrate-only] [--help]

Runs the PyQuest api from source against a development database, so a content or API change
shows up in a browser refresh without an image rebuild.

  --with-spa      start the SPA too, on 5173, and stop both together on Ctrl-C
  --seed          (re)seed the dev database with a throwaway household before starting
  --migrate-only  create and migrate the dev database, then stop — do not start the api
  --help          this message

Without --with-spa this starts the api alone, and the SPA is a second terminal, from pyquest/:

  npm run dev:live --workspace @pyquest/web      then open http://127.0.0.1:5173

Production is untouched: 3081 and 3082 stay bound to their containers throughout.

  DEV_SPA_PORT    override the SPA's port (default 5173)
USAGE
}

SEED=0
MIGRATE_ONLY=0
SPA=0
for arg in "$@"; do
  case "$arg" in
    --with-spa) SPA=1 ;;
    --seed) SEED=1 ;;
    --migrate-only) MIGRATE_ONLY=1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "dev-stack: unknown argument '$arg'" >&2; echo >&2; usage >&2; exit 2 ;;
  esac
done

if [[ "$SPA" == "1" && "$MIGRATE_ONLY" == "1" ]]; then
  echo "dev-stack: --with-spa and --migrate-only contradict each other." >&2
  echo "      --migrate-only stops before anything starts. Pick one." >&2
  exit 2
fi

# Vite's own config pins 5173 with `strictPort: true`, so this is the number to check rather than
# a preference — a vite that finds the port taken exits instead of picking another, and that is
# the correct behaviour for a proxy whose address is written down elsewhere.
DEV_SPA_PORT="${DEV_SPA_PORT:-5173}"

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
#
# Checked BEFORE anything starts, and that ordering is what makes the shutdown below safe to write
# as "kill whatever is listening here": a port this script refused to start on is a port nothing
# of ours is on, and a port it did start on holds our own child and nobody else's.
listening_on() { netstat -ano 2>/dev/null | grep -E "[:.]$1[[:space:]].*LISTEN"; }

port_must_be_free() {
  command -v netstat >/dev/null 2>&1 || return 0
  listening_on "$1" >/dev/null || return 0

  echo "dev-stack: port $1 is already in use ($2)." >&2
  echo >&2
  listening_on "$1" | sed 's/^/      /' >&2
  echo >&2
  echo "      If that is an older dev process, stop it and run this again. This script will" >&2
  echo "      not kill it for you: in the 308x block the likeliest holder is production." >&2
  exit 1
}

port_must_be_free "$DEV_API_PORT" "the dev api"
[[ "$SPA" == "1" ]] && port_must_be_free "$DEV_SPA_PORT" "the SPA"

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

if [[ "$SPA" == "1" ]]; then
  SPA_LINE="   the SPA:    http://127.0.0.1:${DEV_SPA_PORT}   (started by this script, --with-spa)"
else
  SPA_LINE="   the SPA:    npm run dev:live --workspace @pyquest/web      (from pyquest/, another terminal)"
fi

cat <<BANNER

  ────────────────────────────────────────────────────────────────────────
   PyQuest dev api — from source, reloads on restart
  ────────────────────────────────────────────────────────────────────────
   database    ${DEV_POSTGRES_DB}   (NOT ${POSTGRES_DB} — the learner's progress is untouched)
   port        127.0.0.1:${DEV_API_PORT}   (loopback only)
   content     ${REPO}   (read live from the repository)
   production  3081 and 3082 stay up, bound to their containers

${SPA_LINE}
   reload:     Ctrl-C and run this again — about four seconds
  ────────────────────────────────────────────────────────────────────────

BANNER

cd "$REPO/pyquest"

api() {
  env \
    CONTENT_ROOT="$REPO" \
    DATABASE_URL="$DEV_DATABASE_URL" \
    API_PORT="$DEV_API_PORT" \
    API_HOST="127.0.0.1" \
    SPOOL_ROOT="$DEV_SPOOL" \
    WORKSPACE_ROOT="$DEV_WORKSPACES" \
    npm start --workspace @pyquest/api
}

# The api alone: `exec`, so there is no shell left holding a pipe between you and the logs.
if [[ "$SPA" == "0" ]]; then
  api
  exit $?
fi

# ---------------------------------------------------------------------------
# --with-spa: two children, and the only hard part is stopping both.
#
# `npm run X` is not the process doing the work — it spawns node (through cmd.exe on Windows), so
# signalling the pid bash knows about leaves the real listener orphaned, still holding 3083 or
# 5173. The next run then hits the port check above and refuses, and the person who just pressed
# Ctrl-C has to go hunting for a pid. That is a worse experience than the two terminals this flag
# replaces, so the shutdown kills the *tree*.
#
# Killing by port rather than by pid is deliberate and it is safe here for one reason: the checks
# above refused to start unless both ports were free, so anything listening on them now is a child
# of this script. Without that ordering this would be a script that kills strangers.
# ---------------------------------------------------------------------------
stopping=0
stop_everything() {
  [[ "$stopping" == "1" ]] && return   # Ctrl-C then EXIT would otherwise run this twice
  stopping=1
  echo
  echo "dev-stack: stopping the SPA and the api…"
  for port in "$DEV_SPA_PORT" "$DEV_API_PORT"; do
    for pid in $(listening_on "$port" | awk '{print $5}' | sort -u); do
      if command -v taskkill >/dev/null 2>&1; then
        taskkill //PID "$pid" //T //F >/dev/null 2>&1 || true
      else
        kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
      fi
    done
  done


  # npm prints a twelve-line "Lifecycle script failed" block when its child is killed, once per
  # workspace. That block IS this shutdown — nothing failed — but it arrives asynchronously, so
  # without the pause it is the last thing on screen and Ctrl-C looks like a crash. A second of
  # latency on exit is a fair price for the final line being true.
  sleep 1
  echo
  echo "dev-stack: stopped. The npm 'error' blocks above are npm noticing its own child was"
  echo "           killed — that is what stopping looks like, not a fault."
  echo "           Production is untouched: 3081 and 3082 were never involved."
}
trap stop_everything INT TERM EXIT

( npm run dev:live --workspace @pyquest/web -- --host 127.0.0.1 --port "$DEV_SPA_PORT" ) &

api &
API_PID=$!

# Whichever falls over first takes the other down with it. A half-stack — a SPA proxying to an api
# that died, answering every call with a connection error — looks like a broken app rather than a
# stopped one, and that is a bad ten minutes for whoever is looking at it.
#
# `wait -n` is bash 4.3+, and it is checked by VERSION rather than by exit status: `wait -n`
# returns the exit code of whichever child finished, so `if wait -n` would read a SPA that failed
# as "this bash has no -n" and then sit waiting for an api nobody is watching. Given no ids it
# waits for the next of *any* job, which is what is wanted and what 4.3 supports — passing ids to
# it only became legal in 5.1.
if ((BASH_VERSINFO[0] > 4 || (BASH_VERSINFO[0] == 4 && BASH_VERSINFO[1] >= 3))); then
  wait -n || true
else
  wait "$API_PID" || true
fi
