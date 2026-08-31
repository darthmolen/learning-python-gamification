#!/bin/sh
# Assemble the learner-setup payload into a learner's own repository, on a branch.
#
# A learner's machine gets its files the way it will get everything else all year:
# it pulls them (6.4 -- push is the verification mechanism). Not a zip, not a USB
# stick, not a folder dragged across the network. The first thing a new machine does
# is therefore the thing the curriculum is about, which is worth more than the five
# minutes it saves.
#
# Usage:
#   ./pack.sh <path-to-learner-repo>                  # assemble and commit
#   ./pack.sh <path-to-learner-repo> --push           # ... and push it
#   ./pack.sh <path-to-learner-repo> --branch setup-2 # a branch other than the default
#
# Idempotent. Re-running against the same repository updates the branch and says so;
# if nothing in the payload changed it commits nothing and says that instead.
#
# POSIX sh. Requires Git Bash on Windows.
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
MANIFEST="$SCRIPT_DIR/manifest.txt"

BRANCH=learner-setup
PUSH=0
TARGET=

PASS=0
FAIL=0
ok()   { PASS=$((PASS+1)); echo "  PASS  $*"; }
bad()  { FAIL=$((FAIL+1)); echo "  FAIL  $*"; }
step() { echo; echo "=== $* ==="; }
die()  { echo "pack: $*" >&2; exit 1; }

usage() {
  echo "usage: $0 <path-to-learner-repo> [--branch NAME] [--push]" >&2
  exit 2
}

while [ $# -gt 0 ]; do
  case $1 in
    --push)   PUSH=1 ;;
    --branch) shift; [ $# -gt 0 ] || usage; BRANCH=$1 ;;
    -h|--help) usage ;;
    -*)       die "unknown option $1" ;;
    *)        [ -z "$TARGET" ] || die "more than one target given"; TARGET=$1 ;;
  esac
  shift
done

[ -n "$TARGET" ] || usage

# =============================================================================
step "0. the target"
# =============================================================================
[ -d "$TARGET" ] || die "no directory at $TARGET"
TARGET=$(CDPATH= cd -- "$TARGET" && pwd)
[ "$TARGET" != "$REPO_ROOT" ] || die "refusing to pack this repository into itself"

tgit() { git -C "$TARGET" "$@"; }

tgit rev-parse --git-dir >/dev/null 2>&1 || die "$TARGET is not a git repository"

# `rev-parse --git-dir` also succeeds inside a subdirectory of a repository, and packing
# into one would scatter the payload halfway down somebody's tree and commit it to a
# repository they did not name. The root is the only thing that can be meant.
#
# Canonicalised through the same `cd && pwd` as $TARGET, because on Windows git prints
# `C:/Users/...` where Git Bash's pwd prints `/c/Users/...` -- two spellings of one
# directory, and comparing them raw rejects every valid target.
TOP=$(CDPATH= cd -- "$(tgit rev-parse --show-toplevel)" && pwd)
[ "$TOP" = "$TARGET" ] \
  || die "$TARGET is inside a repository rather than the root of one - did you mean $TOP ?"
ok "target repository $TARGET"

# A dirty tree here is somebody's unfinished work, and the copy below would bury it
# in a commit that claims to be a payload.
[ -z "$(tgit status --porcelain)" ] \
  || die "the target has uncommitted changes - commit or stash them first"
ok "target working tree is clean"

# =============================================================================
step "1. the payload exists"
# =============================================================================
# Checked in full before anything is copied. A half-copied payload is worse than no
# payload: it looks finished, and the missing file surfaces on the other machine.
PATHS=$(sed 's/#.*//' "$MANIFEST" | sed 's/[[:space:]]*$//' | grep -v '^$' || true)
[ -n "$PATHS" ] || die "manifest is empty: $MANIFEST"

MISSING=0
COUNT=0
for p in $PATHS; do
  COUNT=$((COUNT+1))
  [ -e "$REPO_ROOT/$p" ] || { bad "missing from this repository: $p"; MISSING=1; }
done
[ "$MISSING" = "0" ] || die "the manifest names files that do not exist - fix it before packing"
ok "$COUNT manifest entries, all present"

# =============================================================================
step "2. the branch"
# =============================================================================
if tgit show-ref --verify --quiet "refs/heads/$BRANCH"; then
  tgit checkout -q "$BRANCH"
  ok "switched to existing branch $BRANCH"
else
  tgit checkout -q -b "$BRANCH"
  ok "created branch $BRANCH"
fi

# =============================================================================
step "3. copy"
# =============================================================================
for p in $PATHS; do
  parent=$(dirname "$p")
  mkdir -p "$TARGET/$parent"
  # A directory entry is copied whole, so `cp -R dir parent/` lands `parent/dir`.
  cp -R "$REPO_ROOT/$p" "$TARGET/$parent/"
done
ok "copied $COUNT entries"

cp "$SCRIPT_DIR/SETUP.md"   "$TARGET/SETUP.md"
cp "$SCRIPT_DIR/RESULTS.md" "$TARGET/RESULTS.md"
ok "SETUP.md and RESULTS.md"

# Python will be run in this clone, and a .pyc built by one machine's interpreter
# landing in another machine's checkout fails once, confusingly, and teaches nothing.
if [ ! -f "$TARGET/.gitignore" ]; then
  printf '__pycache__/\n*.pyc\n' > "$TARGET/.gitignore"
  ok "wrote .gitignore"
else
  ok ".gitignore already present, left alone"
fi
find "$TARGET" -name '__pycache__' -type d -not -path '*/.git/*' -exec rm -rf {} + 2>/dev/null || true

# =============================================================================
step "4. commit"
# =============================================================================
tgit add -A
if tgit diff --cached --quiet; then
  ok "nothing changed - the branch already carries this payload"
else
  tgit commit -q -m "[SETUP] The learner-setup payload

Assembled by tools/learner-setup/pack.sh from the manifest, so the two copies
cannot drift: this branch is generated, and the files it carries are owned by
the campaign repository.

Start at SETUP.md. Results go in RESULTS.md, committed and pushed back."
  ok "committed"
fi

# =============================================================================
step "5. push"
# =============================================================================
# Opt-in. Pushing writes to somebody else's repository, and a script that does it
# unasked is a script nobody can safely run to see what it would do.
if [ "$PUSH" = "1" ]; then
  if tgit push -q -u origin "$BRANCH" 2>/dev/null; then
    ok "pushed $BRANCH"
  else
    bad "push failed - is the remote reachable from here?"
  fi
else
  echo "  not pushed. To send it:"
  echo "      git -C \"$TARGET\" push -u origin $BRANCH"
fi

# =============================================================================
step "result"
# =============================================================================
echo "  $PASS passed, $FAIL failed"
[ "$FAIL" = "0" ] || exit 1
echo
echo "  On the learner's machine:"
echo "      git fetch && git checkout $BRANCH"
echo "  then read SETUP.md."
