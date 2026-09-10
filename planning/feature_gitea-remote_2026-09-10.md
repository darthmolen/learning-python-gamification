---
kind: plan
status: queued
track: gitea-remote
date: 2026-09-10
---

# Ten quests that cannot be verified, and a packer that needs the DM to hold a clone

**Status:** Planned
**Track:** `gitea-remote`
**Date:** 2026-09-10
**Author:** Claude (Opus 5)
**Lane:** A
**Wave:** `wave-4_the-workflow-and-the-bootstrap_2026-09-10`

## Objective

Make the two git verifiers work, open the LAN so a learner's machine can reach Gitea, and give
`pack.sh` a remote path so the DM does not have to hold a clone of somebody else's repository.

## Why this exists

**`local-repo` and `git-signal` refuse in every path today.**

`gitea.ts:107` reads `GITEA_TOKEN`, returns `undefined` when it is unset, and the API then logs
*"no GITEA_TOKEN: local-repo and git-signal will refuse rather than guess"* (`main.ts:99`). The
handle-to-repository mapping is `PLAYER_REPOS` (`gitea.ts:84`), one line of `infra/.env`, and
`gitea.ts:19-23` says so explicitly.

**Neither variable is set anywhere.** Not in `infra/.env.example`, not in the live `infra/.env`,
not in `infra/compose/api.yml`, and `infra/dev-stack.sh:292` sets only `WORKSPACE_ROOT`. So the
refusal is unconditional.

The content says what that costs: of 30 quests, **8 are `local-repo` and 2 are `git-signal`**.
A third of the campaign's graded work cannot be verified, and the failure is a polite log line
rather than a broken test.

**The LAN is closed, and this is measured rather than suspected.**
`planning/backlog/feature_gitea-lan-access-for-the-son_2026-08-27.md` and
`tools/git/local-lan-learner.md:41-101` record two facts about a healthy stack: `GITEA_DOMAIN`
defaults to `localhost`, so the clone URLs Gitea advertises point at whichever machine is reading
them; and Windows Firewall has no inbound rule for 3080 or 3022 — `LAN 3080 -> 000` against
`localhost 3080 -> 200`.

**`practice-zero` is blocked on that half of this track**, because it puts a clone in week 1.

**`pack.sh` has no remote path.** `pack.sh:88-114` requires a filesystem path to the root of a
clean git repository, so the DM must hold a clone of the learner's repository. The only `git push`
in the repository is `pack.sh:159`, pushing from that clone.

## Scope

### 1. The LAN half — do this first, `practice-zero` waits on it

Work `tools/git/local-lan-learner.md:64-101`, which already has the procedure: set
`GITEA_DOMAIN` and `GITEA_ROOT_URL` to the host's LAN address in `infra/.env`, `docker compose
up -d` to bake it into the advertised URLs, then two `New-NetFirewallRule` commands scoped
`-RemoteAddress LocalSubnet`.

**Prove it from the other machine, not from the host** — `curl http://<host>:3080/api/healthz`.
The stub exists because that was never done, and a check run on the host proves nothing about
the case that fails.

Close `feature_gitea-lan-access-for-the-son_2026-08-27` when it passes.

### 2. Wire the two variables

- `infra/.env.example` — `GITEA_TOKEN` and `PLAYER_REPOS`, with the comment saying what each is
  for and how to produce the first.
- `infra/compose/api.yml` — pass both to the `api` service, plus `WORKSPACE_ROOT`, which it also
  omits.
- `infra/dev-stack.sh` — the same two beside the `WORKSPACE_ROOT` it already sets at :292.

Minting the token is already proven twice, at `infra/smoke.sh:173-175` and
`apps/api/tests/support/gitea.ts:122-128`:

```sh
docker compose exec -T --user git gitea gitea admin user generate-access-token \
  --username <dm> --token-name pack --scopes write:repository --raw
```

`PLAYER_REPOS` is `handle=owner/name`, comma or semicolon separated (`gitea.ts:87-92`). Handles
lower-case to match `citext`.

**A note for whoever writes the `.env.example` comment:** `gitea.ts:19-23` says the mapping
*should* be a `players` column and is an env var only because the db track has not added one.
Say that there, so the next person knows it is a waypoint rather than the design.

### 3. `pack.sh --remote`

Clone the learner's repository into a temp directory, apply the payload, push the branch, remove
the temp. `pack.sh` already routes every git call through `tgit() { git -C "$TARGET" "$@"; }`
(`pack.sh:60`), so `--remote` substitutes the temp clone for `$TARGET` and the rest is unchanged.

Three things must be reused rather than reinvented, and each has a scar behind it:

- **The URL shape** — `gitea.ts:192-197` builds
  `http://<owner>:<token>@<host>:3080/<owner>/<repo>.git`. Gitea accepts any username beside a
  token, and this URL pushes as well as clones when the token carries `write:repository`.
- **The non-interactive environment** — `checkout.ts:82-93` sets `GIT_TERMINAL_PROMPT=0`, an
  empty `credential.helper` and `core.askPass`, `GCM_INTERACTIVE=never` and
  `GIT_CONFIG_NOSYSTEM=1`. Without these a bad token opens a Credential Manager dialog and the
  script hangs rather than failing.
- **`redact()`** — `checkout.ts:66-68` strips `//user:pass@` from every error. A token in an
  error message is a token in a terminal scrollback.

Drop the clean-working-tree precondition for this mode: it is meaningless against a clone made
three lines earlier, and keeping it would be a check that can never fail.

Keep `--push` opt-in behavior honest. `pack.sh:154-157` argues that pushing unasked is a script
nobody can safely run to see what it would do; `--remote` pushes by construction, so **say that
in the usage text** rather than letting the two flags quietly disagree.

### 4. The payload CLI

`npm run pack:payload` resolves the learner-safe file list from `audience-flag`'s metadata and
writes it; `pack.sh` reads that instead of a hand-written manifest. Follow the `new:quest` /
`validate:content` CLI shape (`packages/content/src/cli/`).

**This is why the CLI exists rather than a shell grep:** `pack.sh` is POSIX sh and cannot call the
validator, and a frontmatter parser written a second time in a second language is the exact drift
`validate.ts:850` names.

**Prefer an allow-list.** Name what ships. Three things must never reach a learner's machine, and
a deny-list is one forgotten entry away from shipping all three:

| Never ships | Why |
|---|---|
| `dm-guide.md` | the Socratic ladder, the stall table, what to let them get wrong |
| `reference/` | Datamine payloads — *"This directory is yours, not the learner's"* |
| `hidden/` | *"Spec §6.3: these never reach the browser"* |

### 5. Two things the payload gets wrong today

- **The mirror is load-bearing and undocumented.** `tools/ursina/stress.py:95-96` walks
  `parents[2]/curriculum/lib`, which resolves only because the payload reproduces the campaign
  layout verbatim. Flatten or re-root the payload and it breaks with no failing test. Write that
  down where somebody reorganising it would read it — `tools/learner-setup/README.md`.
- **Two `world.py` copies.** `curriculum/lib/README.md:38-45` tells the DM to
  `cp curriculum/lib/world.py <his-repo>/world.py` — the repository **root**, deliberately, so
  that deleting it in Areas 4 and 5 is the learner's own act. The manifest also lands it at
  `curriculum/lib/world.py`. Two shims in one repository, and only one of them is the one the
  curriculum tells them to delete. Ship one, at the root.

## Out of scope

- Adding a `players.gitea_repo` column. It is the right answer and it belongs to the `db` track.
- Anything in `curriculum/area-2/`. `practice-zero` owns that edit.

## The gate

**The load-bearing test is the exclusion test**, because its failure mode is answer keys on a
learner's machine rather than a red suite.

Pack a throwaway repository and assert the result contains no `dm-guide.md`, no `reference/` and
no `hidden/`. Seed the mutant by removing one exclusion from the allow-list and confirm it is
caught; a test that has not been seen to fail here is worth less than nothing, because it reads
as assurance.

For the env wiring the check is behavioral rather than a unit test: with the variables set,
submit one `local-repo` quest and one `git-signal` quest and confirm they resolve rather than
refuse. Setting a variable and asserting the variable is set proves only that a string was
copied.

## Files expected to change

- `infra/.env.example`, `infra/compose/api.yml`, `infra/dev-stack.sh`
- `tools/learner-setup/pack.sh`, `tools/learner-setup/README.md`
- `pyquest/packages/content/src/cli/pack-payload.ts` (new), `pyquest/package.json`
- `curriculum/lib/README.md`
- a test for the packed payload's exclusions

## Verification

```bash
curl http://<host>:3080/api/healthz          # from the learner's machine, not the host
cd pyquest && npm test
tools/learner-setup/pack.sh --remote http://<host>:3080/<learner>/<repo>.git
grep -r "dm-guide\|reference/\|hidden/" <a fresh clone of that branch>   # must return nothing
```

Then with the stack up, submit one `local-repo` quest end to end.

## Evidence

`planning/evidence/gitea-lan-PROOF.txt` — the healthz call from the other machine.
`planning/evidence/payload-exclusions-RED-GREEN-MUTANT.txt`.
