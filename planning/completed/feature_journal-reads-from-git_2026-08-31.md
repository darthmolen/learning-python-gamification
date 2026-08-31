# The Journal Reads From Git

**Status:** Completed
**Track:** `api`
**Date:** 2026-08-31
**Author:** Claude (Opus 5)
**Lane:** A
**Promoted from:** `planning/backlog/promoted_journal-text-has-no-column_2026-08-29.md`, which was
ruled on 2026-08-31 and stopped being a schema question
**Blocks:** `planning/feature_accounts-and-auth_2026-08-30.md` — the auth gate claims
`endpoints.ts` and `apps/api/src/**` and runs alone, so this lands first or not for a while
**Blocked on:** nothing. The layout decision that blocked Phase 1 was ruled on 2026-08-31 —
`planning/reminders/decide_which-journal-layout-the-adr-should-name_2026-08-31.md`, closed — and
Phase 1 landed with it. The ordering constraint against the `flakes` track went with it: Phase 1
turned out to be a curriculum change, so it never touched their files

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

## What reading the code found, and it was worse than a missing route

**Everything in this section is history as of 2026-08-31 — it is kept because the *shape* of the
failure is the reusable part, and because a plan that quietly deletes what it found leaves nobody
able to check whether the fix matched the diagnosis.** What was true when it was written is in
the present tense; what closed it is marked.

### The API watched a file the curriculum never told him to write — **fixed, Phase 1**

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

**Ruled 2026-08-31: the curriculum moves, and the ADR was right.** This section originally argued
the opposite — that the API's string should become `journal/entries` — on the grounds that named
per-session files are easier to re-read before a boss. **That argument was wrong**, and the DM
said so: one continuous document is *better* for reading a stretch of weeks, not worse, and
opening six files is the harder thing. See Phase 1 for what was decided and why. The two
paragraphs of reasoning that stood here are preserved in the closed reminder, which is where a
rejected case belongs.

**So the Journal signal could not fire, §5.6's 10 XP could never have been paid, and every test on
both sides was green.** The API's suite asserted the filter was passed; the curriculum's validator
asserted the template existed. Neither knew the other's string — and `apps/api/tests/journal-path.test.ts`
now does, which is the only reason this cannot come back.

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

- [x] The path the api watches is the file the curriculum tells him to write, **asserted by a
      test that spans the seam** — `apps/api/tests/journal-path.test.ts`, RED at
      `expected 'journal.md' to be 'journal/'`, and the case mutant caught
- [x] A commit touching `journal.md` fires `git-signal: journal-entry`; a commit somewhere else
      does not. **Both were already asserted** — `gitsignal.test.ts:112` and `:117`, the latter
      against the literal string `journal.md`. What was missing was never this test; it was
      anything checking that the string those tests use is the one the curriculum teaches
- [x] `GET /api/players/:playerId/journal` returns entries assembled from git, one per row of
      the `journal_entries` ledger
- [x] `JournalEntrySchema` describes what the API can actually serve. `— blocked` comes off the
      route table
- [x] `POST /api/players/:playerId/journal` and `JournalEntryRequestSchema` are **gone**, and the
      route table is twelve routes rather than thirteen
- [~] An entry whose reply is `### DM reply` in the file renders one. **The Gitea-comment source
      is deferred** to `planning/backlog/feature_journal-reply-from-gitea-comments_2026-08-31.md`,
      for the reason in Phase 3 — it is not needed until Area 2a, week 6
- [x] An entry with an empty `### DM reply` section renders **no** reply, rather than a reply
      containing an HTML comment
- [x] No migration. `git diff packages/db/migrations/` is empty
- [x] `npm test` and `npm run typecheck` clean — 779 passing; the one full-run failure is the
      `flakes` track's documented gitsignal flake, 7/7 in isolation

## Phases

### Phase 1 — the path — ✅ **done 2026-08-31, and it went the other way**

**The DM ruled for one `journal.md` with a dated heading per entry, so the curriculum moved and
the code did not.** Neither of the two layouts this plan weighed won; the answer was a third one,
and it is better than both. `DEFAULT_JOURNAL_PATH = 'journal.md'` was correct all along, and ADR
0004 needs no correction.

**Why one file, in the DM's reasoning:** *"which one is the journal for that session?"* — a
learner opening his folder on a Saturday night should not have to work out which file tonight's
entry goes in, or what number the session is. One file, always the same name, newest entry at the
bottom. Predictability for an 11–14-year-old beat every technical argument on the table, and the
technical objection it raised turned out to be answerable.

**The objection, and its answer.** With one accumulating file, reading it at a commit gives the
whole journal rather than one entry, so extraction becomes either diff-parsing (fragile — the
template invites revisiting old entries) or splitting on a hand-typed date (drifts silently to
`Aug 31`, `8/31`, `31st`). The answer is that the delimiter is **copied from the template rather
than composed**, and it is a real markdown heading:

```markdown
## 2026-08-31 — Session 01
```

`^##\s+(\d{4}-\d{2}-\d{2})\b` parses it, and the heading buys a clickable session index in VS
Code and Gitea for free — which serves §5.6's pre-boss re-read better than either file layout
would have.

**Landed:**

- Both `TEMPLATE.md` files are now an entry to paste rather than a file to copy, leading with the
  dated heading, with every coaching comment preserved verbatim
- Both `entries/` READMEs say where the entries went and why, and keep Area 1's
  *"session 07 is session 07"* — now visibly true rather than asserted
- The two prompt sheets, `session-1-first-light.md`, and the Area 0/1/2 READMEs follow
- `validate:content` is clean: 23 items across 8 areas

**And the guard that stops it recurring** — `apps/api/tests/journal-path.test.ts`, the one test
that spans the seam. It reads the curriculum as the learner is told to read it and requires the
api to be filtering on the file the learner is actually told to write. Full cycle, per
`test-filter-development`:

```text
RED     AssertionError: expected 'journal.md' to be 'journal/'
GREEN   3 passed
MUTANT  'journal.md' -> 'Journal.md'  ->  2 failed, caught
```

The mutant is the case flip on purpose: Gitea runs on Linux and its `?path=` is case-sensitive,
so `Journal.md` pays nothing with no error anywhere. **Getting to that RED took two wrong
failures** — a fence-language mismatch, then CRLF line endings — both of which made the test go
red for a reason that was not the bug. Both are written into the test's comments, because a check
that fails for the wrong reason is how the next person fixes the wrong thing.

### Phase 2 — the contract says what git can serve — ✅ **done 2026-08-31**

**The contract got smaller, which is the rarest and best kind of contract change.** Thirteen
routes are now twelve.

- `prompt` is gone from `JournalEntrySchema`, and the four-prompt problem went with it. `body` is
  the entry as he wrote it, `###` headings and all — four prompts are four headings, visible to
  the writer rather than encoded in a migration
- `POST /journal` and `JournalEntryRequestSchema` are **deleted**, not deferred. He writes
  `journal.md` and commits it, and that *is* the post
- `— blocked` is off the journal read, because the reason for it dissolved
- `server.ts` and `main.ts` say twelve where they said thirteen

```text
RED     5 failed — 13 routes, a POST that existed, 'blocked', and a schema taking a prompt
GREEN   36 passed
MUTANT  POST /journal restored  ->  2 failed, caught
```

Typecheck clean; **763 passed across 49 files**, so nothing downstream relied on the deleted
shape.

**One correction is owed and this plan may not make it.**
`apps/web/src/screens/OverlandScreens.tsx` explains the Journal frame as "required by
`JournalEntrySchema` and held by no column", and its own comment asks whoever takes this plan to
fix that copy. **The file is the `spa` track's**, and `ConsoleScreen.tsx` still says "the thirteen
routes". Two lines, both wrong now, both somebody else's to change.

### Phase 2 — as originally planned

- `JournalEntrySchema`: `prompt` and `body` as they stand cannot be filled from a markdown file
  with four headings. Replace them with the entry's markdown and let the headings be headings.
  `sessionDate`, `commitSha` and `xpAwarded` are unchanged — they come from the ledger row and
  are exactly what it holds.
- **Delete `POST /journal` and `JournalEntryRequestSchema`.** He writes the file and commits it;
  that *is* the post. A route that writes journal text into the API is a second way to author the
  same artifact, and the second way is the one that goes stale. This is the contract getting
  smaller, which is the rarest and best kind of contract change.
- The route table's `— blocked` annotation comes off `GET`, and the `POST` row goes.

### Phase 3 — the read path — ✅ **done 2026-08-31, with one piece deferred**

`GET /api/players/:playerId/journal` is served. All twelve routes now exist.

- **`gitea.readFile`** — one file at the default branch's tip. **HEAD, not the row's sha**, ruled
  by the DM: the Journal is a living document and the template invites revisiting an old entry, so
  an improvement made in week 12 to what he wrote in week 3 should show. That leaves `commitSha`
  doing a ledger sha's real job — provenance for the *payment*, not a pointer for the read
- **`journal.ts`** — splits one `journal.md` into dated sections, lifts the reply out, and strips
  the template's coaching comments. No I/O, so every rule is testable against a string
- **The route** — iterates the **ledger**, not the file. A `## <date>` nobody paid for is not
  rendered: it was never verified by a push (§6.4), and showing XP he did not earn beside writing
  he did is the one thing this screen must not do
- **Absent Gitea, absent repo, absent file, absent section → an empty list.** Never a 404, never a
  failure. §5.6 starts the Journal in week 1 and commits it at Area 2a, so "nothing to read" is
  the correct answer for the campaign's first eight weeks

```text
13 parsing tests, 4 route tests, 3 mutants seeded:
  \b dropped from the date match       ->  1 failed, caught
  reply emptiness without comment strip ->  2 failed, caught
  entry runs to end of file             ->  SURVIVED
```

**The third mutant survived, and finding that was the point.** An entry running to end-of-file
does not leak into the next entry's `body` — `sectionOf` stops at that entry's own `### DM reply`
— so it leaks into the **reply**, and an unanswered entry comes back answered with the whole rest
of the year. The test checked `body` and not `reply`. Strengthened, re-run against the mutant,
caught. This is the case for seeding mutants rather than trusting a green suite, made by a suite
that was green and wrong.

Typecheck clean, content gate clean, **779 passing**. The one failure in the full run is
`server.gitsignal.test.ts`, which passes 7/7 in isolation and is the documented flake the `flakes`
track owns — its file is that session's uncommitted work, so it is doubly not this plan's.

**Deferred, and filed rather than guessed:** the reply source for Area 2a onward, where §5.6 moves
the DM's answer into a Gitea commit comment. Gitea's endpoint for that could not be confirmed from
here, and a wrong one 404s — which this route already reads as "he has not written one yet", so a
mistyped path would render every Area 2a entry unanswered and look entirely normal. That is the
exact failure shape this plan exists to stop, so it goes to
`planning/backlog/feature_journal-reply-from-gitea-comments_2026-08-31.md`, to be done against a
running Gitea where the endpoint can be observed. **Trigger: before Area 2a is taught, week 6.**

### Phase 3 — as originally planned

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
- `pyquest/apps/api/tests/journal.test.ts` — **new.** The read path *and* the two new Gitea
  methods, for the reason below
- `pyquest/apps/api/tests/journal-path.test.ts` — **new, landed.** The seam guard
- `curriculum/area-0/**`, `curriculum/area-1/**`, `curriculum/area-2/README.md` — **Lane B,
  landed.** Phase 1 turned out to live here rather than in `apps/api/src`
- `pyquest/packages/contract/src/endpoints.ts` — `JournalEntrySchema`, the route table, and the
  deletion of `JournalEntryRequestSchema`
- `pyquest/packages/db/**` — **nothing.** The ruling's whole point

**Disjoint from `spa`**, which owns `pyquest/apps/web/**` and `pyquest/vitest.config.ts`.

**Disjoint from `flakes`** (`feature_the-git-tests-stop-flaking_2026-08-31.md`), but only after a
correction made here on 2026-08-31. That plan claims five test files including
`apps/api/tests/gitea.test.ts`, and this one originally claimed it too for the new read methods —
a genuine single-file overlap, which under `plan-workflow`'s rule 2 means the plans were not
independent. **Resolved on this side**, because it is the cheaper one to move: the new methods
are covered in this plan's own new file, and `gitea.test.ts` is left entirely to `flakes`. Its
own note calls this session "the `journal` session, which owns the curriculum tree" — that is not
what this plan owns, and the overlap it missed is the one that mattered.

**One ordering constraint between the two, and it runs this way round.** Phase 1 changes
`DEFAULT_JOURNAL_PATH`, which `flakes` has `gitsignal.test.ts` and `server.gitsignal.test.ts`
open on. Phase 1 is blocked on the DM's ruling anyway, so the sequence resolves itself: `flakes`
lands first, Phases 2 and 3 run beside it in files it does not touch, and Phase 1 goes last.
**Do not start Phase 1 while `flakes` is in-progress**, ruling or no ruling.

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

---

## Status

**Final Status:** Completed
**Track:** `api`
**Completed:** 2026-08-31
**Completed By:** Claude (Opus 5)

### Outcomes

All three phases landed, and the plan closed a live bug it did not set out to find.

- **Phase 1** — one `journal.md`, dated heading per entry. The curriculum moved and the code
  did not, which is the opposite of what this plan proposed
- **Phase 2** — the contract got smaller: `POST /journal` and `JournalEntryRequestSchema`
  deleted, `prompt` removed, thirteen routes down to twelve
- **Phase 3** — `GET /journal` serves, reading at HEAD and joining the ledger to the markdown

Eight of nine criteria are met; the ninth is deferred with a ruling and a filed item.

### Deviations

**Phase 1 inverted.** The plan argued the api's path should become `journal/entries` because
per-session files are easier to re-read before a boss. The DM ruled the other way and was
right: one continuous document is better for reading a stretch of weeks, and "which file do I
write in tonight?" should have one answer. `DEFAULT_JOURNAL_PATH` was correct all along.

**The Gitea reply source was dropped rather than built.** Deferred in Phase 3 because the
endpoint could not be confirmed; then checked against the running instance and found not to
exist. Gitea 1.27.2 has no commit-comment API at all. Ruled: the reply goes in both places, and
`curriculum/area-2/dm-guide.md` §6 argues why.

### Lessons Learned

**The seam is where the bugs live, and nothing was watching it.** The api watched `journal.md`
while the curriculum taught `journal/entries/session-NN.md`, so §5.6's ten XP an entry could
never have been paid — and both suites were green, because each asserted its own half.
`apps/api/tests/journal-path.test.ts` is the only test in the repository that spans a Lane A /
Lane B boundary, and it exists because that gap cost this feature two days.

**A green suite proves nothing until a mutant has been through it.** Three were seeded at
Phase 3 and the third survived: an entry running to end-of-file leaks into the *reply* rather
than the body, so an unanswered entry came back answered with the rest of the year. The test
checked `body` and not `reply`. Nothing else would have found that.

**Deferring beat guessing, measurably.** Had Phase 3 invented a plausible commit-comment URL,
it would have 404'd forever — and this route reads 404 as "he has not written one yet", so
every Area 2a entry would have rendered unanswered and looked entirely normal.

**Two wrong REDs before the right one.** A fence-language mismatch, then CRLF line endings. A
check that fails for the wrong reason is how the next person fixes the wrong thing; both are
written into the test.

### Backlog Items Created

- `planning/backlog/feature_journal-reply-from-gitea-comments_2026-08-31.md` — **dropped
  2026-08-31**, ruled rather than built. Carries the swagger evidence
