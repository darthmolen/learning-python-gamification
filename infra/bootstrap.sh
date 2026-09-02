#!/bin/sh
# =============================================================================
#
#      ONE TIME ONLY.  THIS CLAIMS THE DM SEAT AND CANNOT BE UNDONE.
#
# =============================================================================
#
# The secret this prints is single-use. Spending it creates the DM — the account
# that makes every other account — and once it is spent this script refuses to
# arm another, because re-arming a consumed bootstrap beside an existing DM is a
# second way into the household that nobody remembers leaving open.
#
# After this, accounts are made from the Console.
#
# SAFE TO RE-RUN UNTIL IT IS SPENT, and that is the useful half of "one time
# only". Arming is not claiming. Run this twice before anybody has signed in and
# the second run simply re-primes: a fresh secret is written and the standing one
# stops working. Nothing is created, nothing is lost, and no second way in is
# opened — which is exactly why rotating an UNSPENT secret is allowed while
# re-arming a SPENT one is refused. The first is somebody who mislaid a printout;
# the second would be somebody minting a spare key beside an existing DM.
#
# **Re-running does not hand back the same secret.** It replaces it. If you piped
# the last one to the clipboard and run this again, the clipboard is now stale —
# take the new one.
#
# Once it has been spent, this refuses and says so, and `--status` will tell you
# which side of that line you are on without changing anything.
#
# What it is for: it assembles DATABASE_URL out of ./.env so nobody has to
# remember the connection string, which is the only reason this file exists —
# the command underneath is one line.
#
# Usage:
#   ./bootstrap.sh            arm a secret and print it, once
#   ./bootstrap.sh --status   say whether the seat is taken, and change nothing
#
# Safe to run --status any time. It writes nothing.
#
# ---------------------------------------------------------------------------
# Straight to the clipboard instead of the scrollback, on Windows:
#
#   ./bootstrap.sh | clip
#
# The secret is the only thing on stdout; every other line goes to stderr, which
# is why that pipe works and why it is worth keeping it that way.
#
# On a Mac that would be `| pbcopy`, and on Linux `| xclip -selection clipboard`.
# ---------------------------------------------------------------------------
#
# POSIX sh. Git Bash on Windows.
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$SCRIPT_DIR"

if [ ! -f .env ]; then
  echo "bootstrap: infra/.env is missing. Copy .env.example to .env first." >&2
  exit 1
fi

# Read the file rather than sourcing it: `.env` is compose's format, not shell's,
# and a value with a `#` or a space in it would do something surprising if this
# ran it. Reading the three keys by name has no such opinion.
env_value() {
  sed -n "s/^$1=//p" .env | head -1 | tr -d '\r'
}

PGUSER=$(env_value POSTGRES_USER)
PGPASSWORD=$(env_value POSTGRES_PASSWORD)
PGDATABASE=$(env_value POSTGRES_DB)
PGPORT=$(env_value POSTGRES_PORT)
[ -n "$PGPORT" ] || PGPORT=5433

if [ -z "$PGUSER" ] || [ -z "$PGPASSWORD" ] || [ -z "$PGDATABASE" ]; then
  echo "bootstrap: .env is missing POSTGRES_USER, POSTGRES_PASSWORD or POSTGRES_DB." >&2
  exit 1
fi

# `localhost` because this runs on the host, not in the compose network. Inside a
# container the host would be `postgres`; from here that name resolves to nothing,
# and the failure looks like the database being down rather than the address being
# wrong.
export DATABASE_URL="postgresql://${PGUSER}:${PGPASSWORD}@localhost:${PGPORT}/${PGDATABASE}"

cd ../pyquest

# Everything this script says goes to stderr. The secret, printed by the command
# below, is the only thing on stdout — that is what makes `| clip` work.
if [ "${1:-}" = "--status" ]; then
  exec npm run --silent bootstrap --workspace @pyquest/db -- --status
fi

# One line, not two: the command below already says "shown once and is not stored",
# and repeating it here only trains people to skim both.
echo "bootstrap: ONE TIME ONLY — spending this secret claims the DM seat." >&2
echo "bootstrap: safe to re-run until it is spent; each run replaces the last one." >&2
echo >&2

exec npm run --silent bootstrap --workspace @pyquest/db
