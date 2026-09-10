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
#   ./pack.sh --remote <clone-url>                    # clone, apply, push, forget
#
# `--remote` exists because the path form assumes the DM is holding a clone of somebody
# else's repository, and there is no reason they should be. Gitea has the repository; this
# borrows it for the length of one command. The URL is the one from
# `tools/git/local-lan-learner.md` -- `http://<host>:3080/<learner>/<repo>.git` -- and it may
# carry a token, which is why nothing here ever echoes it unredacted.
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
REMOTE=
TEMP_CLONE=

PASS=0
FAIL=0
ok()   { PASS=$((PASS+1)); echo "  PASS  $*"; }
bad()  { FAIL=$((FAIL+1)); echo "  FAIL  $*"; }
step() { echo; echo "=== $* ==="; }
die()  { echo "pack: $*" >&2; exit 1; }

usage() {
  echo "usage: $0 <path-to-learner-repo> [--branch NAME] [--push]" >&2
  echo "       $0 --remote <clone-url>   [--branch NAME]" >&2
  echo >&2
  echo "  --remote clones the learner's repository to a temp directory, applies the" >&2
  echo "  payload, pushes the branch and removes the clone. It pushes by construction;" >&2
  echo "  --push is for the path-based form, where the clone is somebody's own checkout." >&2
  exit 2
}

while [ $# -gt 0 ]; do
  case $1 in
    --push)   PUSH=1 ;;
    --branch) shift; [ $# -gt 0 ] || usage; BRANCH=$1 ;;
    --remote) shift; [ $# -gt 0 ] || usage; REMOTE=$1 ;;
    -h|--help) usage ;;
    -*)       die "unknown option $1" ;;
    *)        [ -z "$TARGET" ] || die "more than one target given"; TARGET=$1 ;;
  esac
  shift
done

[ -z "$REMOTE" ] || [ -z "$TARGET" ] || die "give a path or --remote, not both"
[ -n "$TARGET" ] || [ -n "$REMOTE" ] || usage

# =============================================================================
# git, with every prompt disabled.
#
# Lifted from `apps/api/src/checkout.ts`, which learned it the hard way: without these a bad
# token opens a Credential Manager dialog on Windows and the script hangs forever instead of
# failing in a second. A packer nobody can run unattended is a packer nobody runs.
# =============================================================================
qgit() {
  GIT_TERMINAL_PROMPT=0 \
  GIT_CONFIG_NOSYSTEM=1 \
  GCM_INTERACTIVE=never \
  git -c credential.helper= -c core.askPass= "$@"
}

# A URL with `//user:token@` in it, with the credential removed. `checkout.ts` does the same and
# for the same reason: a token in an error message is a token in somebody's scrollback.
redact() { printf '%s' "$1" | sed 's#//[^/@]*@#//#'; }

# The temp clone is removed however this exits, including on a failed push. Leaving a checkout
# of somebody else's repository lying around in $TMPDIR is not a thing a setup tool should do.
cleanup() { [ -z "$TEMP_CLONE" ] || rm -rf "$TEMP_CLONE"; }
trap cleanup EXIT INT TERM

if [ -n "$REMOTE" ]; then
  step "0. the remote"
  TEMP_CLONE=$(mktemp -d 2>/dev/null || mktemp -d -t pack) \
    || die "could not make a temp directory to clone into"
  qgit clone --quiet "$REMOTE" "$TEMP_CLONE/repo" \
    || die "could not clone $(redact "$REMOTE") - is the host reachable and the token valid?"
  TARGET="$TEMP_CLONE/repo"
  # It pushes by construction: a temp clone nobody keeps is worth nothing unless it is sent.
  PUSH=1
  ok "cloned $(redact "$REMOTE")"
fi

# =============================================================================
step "0. the target"
# =============================================================================
[ -d "$TARGET" ] || die "no directory at $TARGET"
TARGET=$(CDPATH= cd -- "$TARGET" && pwd)
[ "$TARGET" != "$REPO_ROOT" ] || die "refusing to pack this repository into itself"

# Every git call against the target goes through the non-interactive environment too: a
# credential prompt is as fatal in a push as it is in a clone.
tgit() { qgit -C "$TARGET" "$@"; }

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
step "1. the payload"
# =============================================================================
# Two halves, and only one of them is written by hand.
#
# `manifest.txt` still names the toolchain instructions, because no property of
# `tools/python/README.md` says a learner should have it -- a person decided that. The
# curriculum half is derived instead: every document under an area declares an `audience:`,
# so "may a learner have this?" is a question the tree answers, and a new area needs no edit
# here at all.
#
# `pack:payload` owns both, in TypeScript, because the marking is frontmatter and a second
# parser written in shell is exactly the drift the content validator refuses by name. It also
# repeats the existence check below, so a path that does not exist stops the run before
# anything is copied -- a half-copied payload is worse than no payload: it looks finished, and
# the missing file surfaces on the other machine.
command -v node >/dev/null 2>&1 \
  || die "node is not on PATH, and pack:payload needs it to read the audience marks"

PATHS=$( (cd "$REPO_ROOT/pyquest" && npm run --silent pack:payload) ) \
  || die "pack:payload refused - run it directly to see which paths it could not find"
[ -n "$PATHS" ] || die "pack:payload named nothing at all"

MISSING=0
COUNT=0
for p in $PATHS; do
  COUNT=$((COUNT+1))
  [ -e "$REPO_ROOT/$p" ] || { bad "missing from this repository: $p"; MISSING=1; }
done
[ "$MISSING" = "0" ] || die "the payload names files that do not exist - fix it before packing"
ok "$COUNT payload entries, all present"

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
  if tgit push -q -u origin "$BRANCH"; then
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
