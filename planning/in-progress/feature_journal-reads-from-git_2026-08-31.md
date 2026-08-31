# The Journal Reads From Git

**Status:** In Progress
**Track:** `api`
**Date:** 2026-08-31
**Author:** Claude (Opus 5)
**Lane:** A
**Promoted from:** `planning/backlog/promoted_journal-text-has-no-column_2026-08-29.md`, which was
ruled on 2026-08-31 and stopped being a schema question
**Blocks:** `planning/feature_accounts-and-auth_2026-08-30.md` — the auth gate claims
`endpoints.ts` and `apps/api/src/**` and runs alone, so this lands first or not for a while
**Blocked on:** **Phase 1 only**, and by a decision rather than by work —
`planning/reminders/decide_which-journal-layout-the-adr-should-name_2026-08-31.md`. ADR 0004 and
the curriculum name two different layouts, and which one moves is the DM's call. **Phases 2 and 3
do not wait**: the contract correction and the read path are indifferent to how many files the
Journal is kept in

## Objective

Serve `GET /api/players/:playerId/journal` by reading his repository, so the Journal stops being
the one screen in the game with no data behind it — and fix the path disagreement that means the
Journal signal can never fire.

## The ruling this rests on

**Markdown in his repository is the system of record. Postgres is not.**
[`docs/decisions/0004-ceremony-earns-its-place-by-outliving-the-game.md`](../../docs/decisions/0004-ceremony-earns-its-place-by-outliving-the-game.md),
2026-08-31, in the DM's words: *"Markdown is the right call, it's transportable and could
conceivably live past the education viability of this whole tool. If we strand it in the db, it
dies with the game."*

So: **no migration, no schema change at all.** `journal_entries` keeps the four columns it was
designed with and is exactly what it was designed to be — the ledger of paid journal commits,
not the journal. The three "missing" columns were never missing; they were in the wrong store.

## What reading the code found, and it is worse than a missing route

### The API watches a file the curriculum never tells him to write

`apps/api/src/gitea.ts:29`:

```ts
const DEFAULT_JOURNAL_PATH = 'journal.md';
```

`curriculum/area-0/journal/entry-01-prompt.md`, under *Where the entries live*:

```text
journal/
  TEMPLATE.md          copy this each time
  entry-01-prompt.md
  entries/
    session-01.md
    session-02.md
```

**One entry per file, under `journal/entries/`. There is no `journal.md`.** `gitsignal.ts:95`
passes that path to `gitea.commits({ path })`, which becomes Gitea's `?path=` — `git log --
journal.md`. A commit touching `journal/entries/session-07.md` does not match it.

**And ADR 0004 says `journal.md` as well**, in two places: *"He commits `journal.md` anyway —
`gitea.ts` already names `DEFAULT_JOURNAL_PATH`"*, and the survivability table's row for the
Journal reads "`journal.md`, his repo". So this is three documents and two layouts, not the API
drifting from the curriculum on its own.

**The ADR's decision is unaffected, and only a detail in it is wrong.** Its argument is markdown
in his repository versus columns in Postgres; `journal.md` appears as shorthand for the artifact,
and every line of the reasoning holds identically for a directory of session files. Nothing about
"if we strand it in the db, it dies with the game" depends on the file count.

**The curriculum's layout is the one to keep**, and not only because CLAUDE.md makes the
curriculum the real work:

- §5.6 has him **re-read his Journal from the start of an area before every boss fight**. Six
  files named for their sessions are re-readable; one long file scrolled to the right offset is
  not.
- The Area 0 prompt sheet has the DM reply written **under the line in the same file**, which
  needs a file per entry to be a place rather than an append.
- `TEMPLATE.md` exists to be copied. Copying it into one accumulating file is not a thing the
  instruction describes.

So the string that moves is the API's, and the ADR needs a factual correction rather than a
reversal — **the DM's call, not this plan's.** Recorded as a reminder rather than edited here.

**So the Journal signal cannot fire, the 10 XP of §5.6 can never be paid, and every test on both
sides is green.** The API's suite asserts the filter is passed; the curriculum's validator
asserts the template exists. Neither knows the other's string.

This is the shape the auth plan calls the repository's characteristic failure, and it is the
third instance in two days: `PLAYER_ID = 'peer'` against a uuid column, the SPA fixtures against
the API's payloads, and now a path filter against a curriculum layout. Two halves, each
internally consistent, disagreeing at a seam no unit test spans.

**The bitter part** is the comment already sitting above that code. `gitea.ts:191` explains at
length why a 404 from a path filter must not be reported as "you have not written your Journal",
because that would tell a learner he had not done the work when he had. That is now exactly what
happens — for a different reason than the one it guards against.

### The four prompts are four headings, as the ruling predicted

`curriculum/area-0/journal/TEMPLATE.md` is the entry, and its shape decides the contract:

| Heading | Was going to be |
|---|---|
| `## What I built` | `prompt` + `body`, somehow |
| `## What broke` | — |
| `## What I would do differently` | — |
| `## What will break next time` | the §5.6 forecast Defend reads back |
| `## DM reply` | `reply` |

`prompt` as a single `string` cannot hold four of them. In markdown it does not have to: the
prompts are headings the writer can see, which is the whole of what the ruling dissolved.

**And `reply` has two sources, by area.** In Areas 0–1 the DM writes under `## DM reply` in the
same file — the prompt sheet calls this non-negotiable, *"a Journal nobody answers becomes a
diary"*. From Area 2a it becomes a Gitea commit comment, which is where §5.6 puts it. Both are
real, they are sequential rather than alternative, and a read path that handles only the second
returns nothing for the first eight weeks of the campaign.

## Success Criteria

- [ ] A commit touching `journal/entries/session-07.md` fires `git-signal: journal-entry`; a
      commit touching only `README.md` does not. **Both asserted, the second one especially**
- [ ] `GET /api/players/:playerId/journal` returns entries assembled from git, one per row of
      the `journal_entries` ledger
- [ ] `JournalEntrySchema` describes what the API can actually serve. `— blocked` comes off the
      route table
- [ ] `POST /api/players/:playerId/journal` and `JournalEntryRequestSchema` are **gone**, and the
      route table is twelve routes rather than thirteen
- [ ] An entry whose reply is `## DM reply` in the file, and an entry whose reply is a Gitea
      comment, both render a reply
- [ ] An entry with an empty `## DM reply` section renders **no** reply, rather than a reply
      containing an HTML comment
- [ ] No migration. `git diff packages/db/migrations/` is empty
- [ ] `npm test` and `npm run typecheck` clean

## Phases

### Phase 1 — the path, and the test that proves the signal was dead

The smallest change and the only one that fixes a live bug. It goes first because it is
independently valuable: it pays the Journal's XP whether or not the read path ever lands.

- **RED first, and captured.** A test that commits `journal/entries/session-01.md` and asserts
  the signal fires. It must fail against today's `journal.md`, and the failure output goes in the
  commit message — per `test-filter-development`, a check nobody has watched fail is worth
  nothing, and this plan exists because two such checks were green.
- `DEFAULT_JOURNAL_PATH` becomes `journal/entries`. Gitea's `?path=` is `git log -- <path>` and
  takes a directory, so the prefix matches every session file and nothing else.
- **`journal/entries`, not `journal`.** Editing `TEMPLATE.md` is not writing an entry, and a
  filter that paid XP for it would pay for copying a file.
- `JOURNAL_PATH` stays the override it already is. Only the default is wrong.

**Done when** a commit under `journal/entries/` pays 10 XP and a commit outside it pays nothing,
both proved, and the mutant — reverting the constant — is caught.

### Phase 2 — the contract says what git can serve

- `JournalEntrySchema`: `prompt` and `body` as they stand cannot be filled from a markdown file
  with four headings. Replace them with the entry's markdown and let the headings be headings.
  `sessionDate`, `commitSha` and `xpAwarded` are unchanged — they come from the ledger row and
  are exactly what it holds.
- **Delete `POST /journal` and `JournalEntryRequestSchema`.** He writes the file and commits it;
  that *is* the post. A route that writes journal text into the API is a second way to author the
  same artifact, and the second way is the one that goes stale. This is the contract getting
  smaller, which is the rarest and best kind of contract change.
- The route table's `— blocked` annotation comes off `GET`, and the `POST` row goes.

### Phase 3 — the read path

- **Two new methods on `Gitea`**, which today has `commits()` and `tags()` and no way to read
  content: the file at a ref (`/repos/{owner}/{repo}/contents/{path}?ref={sha}`) and a commit's
  comments (`/repos/{owner}/{repo}/git/commits/{sha}` / the comments endpoint). Both parsed the
  way `commits()` parses — through named raw shapes, not casts.
- **Assemble**: for each `journal_entries` row, read the entry file at that commit and attach the
  reply, preferring a Gitea comment and falling back to the file's `## DM reply` section.
- **An empty `## DM reply` is no reply.** The template ships that heading with an HTML comment
  under it, so the section exists from the first entry and is empty until answered. Stripping
  comments and testing for remaining text is the difference between "unanswered" and "answered
  with `<!-- Dad writes here -->`".
- Gitea unreachable is a failed resource, not a 500 — the client already models that, and
  `Awaiting` already renders it.

## Dependencies / Prerequisites

- **None blocking.** The ruling is made, the ledger table exists, `gitsignal.ts` and `gitea.ts`
  are built, and `@pyquest/engine` already pays the Journal's 10 XP through the signal
- The `spa` track owns the Journal *screen*. This plan serves it and does not draw it

## Files Expected to Change

- `pyquest/apps/api/src/gitea.ts` — the default path, and two read methods
- `pyquest/apps/api/src/gitsignal.ts` — only if the path change reaches it
- `pyquest/apps/api/src/server.ts` — the `GET /journal` handler, and the `POST` route's removal
- `pyquest/apps/api/tests/journal.test.ts` — **new**
- `pyquest/apps/api/tests/gitea.test.ts` — the new methods
- `pyquest/packages/contract/src/endpoints.ts` — `JournalEntrySchema`, the route table, and the
  deletion of `JournalEntryRequestSchema`
- `pyquest/packages/db/**` — **nothing.** The ruling's whole point

**Disjoint from `spa`**, which owns `pyquest/apps/web/**` and `pyquest/vitest.config.ts`, and
from the session working the test flakes, which owns `checkout.test.ts`,
`server.localrepo.test.ts` and `server.gitsignal.test.ts`. This plan adds a new test file and
touches `gitea.test.ts`, neither of which is on that list.

## Out of Scope

- **The SPA's Journal screen.** `apps/web/**` belongs to the open `spa` track. This plan makes
  the screen possible and coordinates rather than editing across it
- **Any migration.** See the ruling
- **Whether journalling earns XP before Area 2a.** §5.6 has the Journal start in week 1 as plain
  markdown and become committed at Area 2a, and XP is paid on commit — so under this ruling weeks
  1–8 of journalling pay nothing. That may be exactly right, the habit preceding the reward. It
  is a **curriculum decision nobody has made**, it is Lane B, and it should be settled before Area
  0 is taught rather than discovered in week 2 when he asks why writing got him nothing
- **`CHANGELOG.md` and the per-area release notes** (§5.6's last paragraph). Same artifact family,
  different signal, not this plan

## Anticipated Backlog

- **The curriculum and the API agree by coincidence, not by construction.** Phase 1 fixes one
  string. Nothing stops the next one drifting: `JOURNAL_PATH`'s default and
  `curriculum/area-0/journal/`'s layout are written down in two places and checked against each
  other nowhere. The test that would have caught this is the one that reads the curriculum's own
  documented layout and asserts the API's default matches it
