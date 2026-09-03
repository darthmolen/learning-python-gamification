# Finish the SPA

## Context

`planning/feature_spa_2026-08-28-v2.md` yielded the `spa` track to the auth gate on
2026-09-01 — idle rather than blocked. The gate has closed, `planning/in-progress/` is
empty, and four things landed underneath the plan while it was parked (auth, `GET /journal`,
the Console's two panels, migration `0006`). This session promotes the plan back and closes
its four remaining criteria.

Verified against the code on 2026-09-01, not taken from the plan's checkboxes:

| Criterion | Real state |
|---|---|
| Run in Pyodide | Built. `src/turtle/runner.worker.ts`, `turtle.py`, `protocol.ts`, `TurtleCanvas.tsx`, all tested |
| **Submit posts to the API** | **Not wired at all.** No `/submit` and no `/api/jobs` in `src/gateway/index.ts`. The Submit button is `disabled` with a hardcoded "needs the API" line |
| `POST /defend/:conceptId` | Not called. The queue renders; nothing records |
| Nine screens | The Journal is still a frame in [OverlandScreens.tsx](pyquest/apps/web/src/screens/OverlandScreens.tsx) |
| Keyboard + accessible names | Never swept |
| Laptop at 1366×768 | Stale. The check cleared 2026-08-31 and his screen is 1920×1080 |

Two defects found while reading, both in files this track owns:

- **`postSignoff` sends no bearer token.** [gateway/index.ts:361-365](pyquest/apps/web/src/gateway/index.ts#L361-L365)
  builds a raw `fetch` with `accept` and `content-type` only. Every route but
  `POST /api/session` and `POST /api/session/bootstrap` is behind the `onRequest` guard
  (`server.ts:386,410`), so **granting a sign-off against a live API answers 401 today**.
  `send()` already exists three functions above and does exactly the right thing.
  `fetching.test.ts:169` asserts `objectContaining({ method, body })`, which is why nothing
  noticed.
- **Not every Submit is pollable.** `peer-signoff` returns 202 with `jobId` = the *attempt*
  id and no `runner_jobs` row; `GET /api/jobs/:jobId` demands `/^\d+$/` and would 404 on it.
  `git-signal` returns **200 with a terminal state** and nothing to poll at all. Only
  `hidden-tests` and `local-repo` enqueue a job. Getting this wrong makes a submission that
  worked read as "job not found".

## Approach

Four phases, in the order the brief suggests: the §6.3 path first, then the screen that
completes the count, then the drill, then the sweep. Each phase is `test-filter-development`
— RED with the output captured, GREEN, then the named mutant.

**The seams already exist and are reused, not rebuilt.** `get`/`send` in the gateway,
`useResource`/`Awaiting` for reads, the `runner.ts` pattern (every decision in a pure
reducer, the hook owns only the I/O) for Submit, `present/index.ts` for anything that turns
a number into a claim, `AsSignedIn` for screen tests.

---

## Phase 0 — promote, and fix the two defects

Move `planning/feature_spa_2026-08-28-v2.md` to `planning/in-progress/` per `plan-workflow`;
clear `**Blocked on:**`; rewrite the laptop criterion to say **1920×1080, checked
2026-08-31** rather than asking for a resolution he does not have.

**`postSignoff` uses `send()`.** It keeps its own 403-body reading — that is the one place a
client reads an error body, and the reasoning in its docblock stays — but the request goes
through the helper that carries the token and maps 401 to `Unauthenticated`.

- RED: `fetching.test.ts` asserts `authorization: Bearer …` on the sign-off POST with a
  token in storage. Fails today.
- Mutant: drop `authHeaders()` from `send()` and the new case must fail.

## Phase 1 — Submit, and the poll

**Gateway** — `submitQuest(playerId, questId, body: SubmitRequest): Promise<JobAccepted>`
through `send()` + `JobAcceptedSchema.parse`, and `getJob(jobId): Promise<JobView>` through
`get()` + `JobViewSchema`. Fixtures gain a submit answer and a job that walks
`queued → running → passed`, so the offline app exercises the poll and the suite stays
hermetic.

**`src/quest/submit.ts`** — a pure reducer beside `runner.ts`, and the place the three
verifier behaviours are decided:

| Verifier | What Submit does |
|---|---|
| `hidden-tests` | 202 + numeric `jobId` → poll until terminal |
| `local-repo` | same, and sends a ref rather than code (§6.4 — push is the mechanism) |
| `peer-signoff` | 202, but **never poll**: no job row exists. It is queued for the seat `view.verifier.by` names, and the screen says so |
| `git-signal` | 200 with a **terminal** state. Show it; do not poll |

The rule that covers all four without a fourth branch: **poll only while the state is
`queued` or `running` *and* the submission enqueued a job.** Terminal states are `passed`,
`failed`, `timed-out`, `killed`, and `killed` must not say "your code is wrong" — the
contract's own comment (`endpoints.ts:111-114`) is why it survives as a state.

**`src/quest/useSubmit.ts`** — owns the interval and nothing else, the way `useRunner` owns
the worker. Injectable clock so tests do not wait.

**`QuestScreen`** — Submit becomes live. `disabled` only while a submission is in flight,
and for `hidden-tests` while `isUnchanged(code, starter)` is true (that check is the
mechanic; the other three verifiers do not read the editor). The label stays exactly
`Submit`. State goes in a status line beside it in the prototype's vocabulary —
`Submit · queued`, `Submit · working`, `Submit · passed`, `Submit · failed`. `JobResult`'s
`stdout`/`stderr` render in the console panel, and `truncated: true` must say it was cut off
rather than letting him read a stopped traceback as a finished one.

**Ripple worth naming:** the screen will hold two `role="status"` regions. `getByRole('status')`
throws on two matches, so both get an accessible name and the seven existing assertions in
`quest-screen.test.tsx` move to `getByRole('status', { name: 'Run' })`.

- RED first: a test that clicks Submit on the fixture quest and expects `Submit · passed`.
- Mutants, each of which must fail the suite: poll a `git-signal` submission; poll a
  `peer-signoff` submission; treat `killed` as `failed`; let Submit through on unchanged code
  for a `hidden-tests` quest; drop `.parse()` from `getJob`; render a truncated result
  without saying so; make the Submit label change with state.

## Phase 2 — the Journal

`GET /journal` is served (`server.ts:944-979`) and returns `JournalEntry[]` —
`sessionDate`, `body`, `commitSha`, `xpAwarded`, optional `reply`. The screen renders that
and adds the one thing a learner staring at an empty Journal in week 1 needs: **how an entry
gets there.**

**The template is served, not hardcoded.** `curriculum/area-0/journal/TEMPLATE.md` and
`area-1`'s differ substantially and one lands per area. Sixty lines of authored coaching
copied into a `.tsx` is the `AREA_NAMES` mistake at four times the size, and
`boundary.test.ts` already forbids the small version of it.

- **Contract** — `JournalTemplateSchema { area, markdown, path }` in `endpoints.ts`, plus its
  row in the route table. `path` is where it goes (`journal.md`, from `JOURNAL_PATH`), so the
  instruction on screen is served rather than invented.
- **API** — `GET /api/players/:playerId/journal/template`. The area is the first whose
  `progress.cleared < progress.total` (`campaignView` already computes those cards), falling
  back to the nearest earlier area that has a `TEMPLATE.md` — only areas 0 and 1 do today, so
  the fallback is load-bearing rather than defensive. 404 when none exists.
- **`content.ts`** — add `exists(relativePath): boolean` beside `read`, through the same
  `resolveInside` escape check. Catching ENOENT from `read` would swallow every other read
  failure with it.

**The screen** — new `src/screens/JournalScreen.tsx`; `OverlandScreens.tsx` is deleted, since
the Journal was the last thing in it. Geometry from `docs/design/pyquest/Journal.dc.html`:
296px entry list, center body, 404px reply column.

- Entry list, newest first. Each row carries the artboard's 12×12 speech-bubble in `#3f9fb5`
  when `reply !== undefined` — with an accessible name, so it is not a glyph a screen reader
  skips — and the XP the entry paid.
- Center: the selected entry's `body` and its `commitSha`. Right: the `reply` when there is
  one; **"no reply yet"** when there is not, because §5.6's reply lands later than the entry.
- The artboard says *"Dad replied"*. The lexicon says `dm`. The screen says **DM reply**.
- **The template panel.** A button that expands **in place and pushes the page down** —
  the Tome's rule, no pop-over, `aria-expanded` + `aria-controls`, and a label that does not
  change on the second press. Inside: the served markdown verbatim in a `<pre>`, a copy
  button, the served `path`, and the two things `journal.ts` actually parses — that the
  heading is `## YYYY-MM-DD` copied rather than retyped, and that it goes at the bottom of
  the file.
- **Empty is normal, not broken.** The API returns `[]` for the first eight weeks by design
  (`server.ts:940-942`). The screen says so and still offers the template. `Awaiting`'s
  failed state would call that a fault.

**A new presentation rule, and `formatPayout` is not it.** §5.10's zero-reads-as-`brag`
is right for an elective medal and wrong here: §5.6 pays ten XP *for substance*, and an entry
that paid nothing had empty prompts. Calling that a brag congratulates him for not writing.
So `journalPayout` joins `present/index.ts` with its argument written down, and the mutant is
swapping it for `formatPayout`.

## Phase 3 — the Defend drill

**Gateway** — `postDrill(playerId, conceptId, { repelled })` → `DrillOutcomeSchema`, through
`send()`.

**Screen** — each queue row gains two fixed-label buttons; §5.4 is a self-report, and
`DrillResultSchema` is `{ repelled: boolean }` and nothing else, `.strict()` so a client
cannot smuggle a date. On resolution the row shows the returned `rung`, `dueOn` and XP —
the engine's numbers, carried, not recomputed. Zero here is a concept let through, which is
not a brag either.

Concept labels come from `getConcept` in `@pyquest/content/browser` (the safe entry
`boundary.test.ts` insists on).

**What stays undrawn, and why.** The artboard gives each drill a `prompt` — *"Total the
values in a list without using sum()"* — and `DueInvasionSchema`'s own comment says `prompt`
and `why` are content looked up by concept id. **That content does not exist.** So the row
shows what is served: the concept, its area, `lastSeen`, the source, and the `+5` §5.1
prices. The artboard's right-hand column (attendance, streak, last-session recap) has artwork
and no endpoint and goes the way the Console's did. The journal nudge stays, as a link to
`/journal` — navigation is not invented data.

- Mutants: drop the `dueOn` from the resolved row; send `repelled: true` from the "let it
  through" button; recompute `rung + 1` instead of using the returned rung; render a
  zero-XP drill as `brag`.

## Phase 4 — keyboard and accessible names

A deliberate sweep of all nine screens with the mouse unplugged, plus the guard that keeps it
swept:

- `a11y.test.tsx` renders each of the nine and asserts every `button`, `link` and `textbox`
  has a non-empty accessible name.
- A source guard beside the boundary tests: no `onClick` on a non-interactive element under
  `src/screens/**` and `src/shell/**`. A clickable `div` is the failure mode that a
  render-based test cannot see.
- A skip link to the main region. Six rail destinations precede the content on every screen,
  and tabbing past them nine times is the thing that makes a keyboard user stop using one.
- Check the inline styles have not removed focus rings; add a visible one in
  `design/tokens` if they have.
- Rewrite the plan's laptop criterion to **1920×1080**.

---

## Files expected to change

- `pyquest/apps/web/src/**` — gateway, `quest/`, `screens/`, `present/`, `fixtures/`,
  `test-support/`. `screens/OverlandScreens.tsx` is deleted
- `pyquest/packages/contract/src/endpoints.ts` — `JournalTemplateSchema` and its route row
- `pyquest/apps/api/src/server.ts` — the template route
- `pyquest/apps/api/src/content.ts` — `exists()`
- `planning/feature_spa_2026-08-28-v2.md` → `planning/in-progress/`

**Track note.** This claims two `api`-track files for the template route. `planning/in-progress/`
is empty, so nothing collides — but the plan must say so out loud rather than letting the next
plan discover it.

## Verification

From `pyquest/`, all four green — they were at `80f1c64`, 857 passing across 54 files:

```bash
npm test
npm run typecheck
npm run validate:content
npm run build --workspace @pyquest/web
```

Then against the live stack, because none of the above has ever booted Pyodide or spoken to
Postgres:

1. `npm run bootstrap --workspace @pyquest/db` with `DATABASE_URL` from `infra/.env` (5433).
   Paste the printed secret into the sign-in screen's first-time form; add `peer` from the
   Console's accounts panel.
2. Run the api and Vite from the host — the `api`, `web` and `migrate` compose services still
   do not start on Windows.
3. **Submit a `git-signal` quest.** It resolves without the runner and is the fastest proof
   the whole path works end to end, including the branch that must not poll.
4. Submit a `peer-signoff` quest, then grant it from the Console — which is also the check
   that Phase 0's missing bearer token is actually fixed.
5. Open the Journal, expand the template panel, and confirm the markdown is the file on disk.
6. Run a Defend drill and confirm `dueOn` moves.
7. Tab through all nine screens with the mouse unplugged.

---

## Plan Review

**Reviewed:** 2026-09-01 18:17
**Reviewer:** Claude Code (plan-review-intake)

### Strengths

- **Context / Approach**: Strong fact-checking against current code, not stale checklist claims. The plan correctly anchors to existing seams (`send/get`, `useResource`, pure reducer + hook split, `present/index.ts`).
- **Phase 0**: Good catch on `postSignoff` bypassing `send()`, and the plan ties it to the auth guard in `server.ts`.
- **Phase 1**: Sound architectural direction for Submit: gateway → pure reducer → hook-owned polling → screen rendering.
- **Phase 2**: Good insistence that the Journal template be served from content, not hardcoded.
- **Phase 4**: Accessibility sweep is concrete and aligned with project UI rules.

### Issues

#### Critical (Must Address Before Implementation)

- **Phase 1 / verifier table**
  - **Problem:** The plan claims `peer-signoff` returns "202, but never poll" and `git-signal` returns "200 with a terminal state," but `JobAcceptedSchema` only models `{ jobId, state }`, and the route table still says submit returns a runner job id.
  - **Why it matters:** As written, the contract does not represent the branching rule the plan depends on.
  - **Suggested fix:** Add an explicit contract change: either broaden the submit response shape to encode pollability/terminal result, or revise the plan to match current contract/API behavior.

- **Phase 2 / Journal template route**
  - **Problem:** The plan says add `JournalTemplateSchema` and "its row in the route table," but no such schema/route exists yet in the contract file.
  - **Why it matters:** The plan's implementability depends on a contract-first change, but it does not explicitly sequence web/api work behind that dependency.
  - **Suggested fix:** State task order: contract first, then API route, then gateway/UI.

- **Phase 0 / promote plan**
  - **Problem:** The plan says move `planning/feature_spa_2026-08-28-v2.md` to `planning/in-progress/`, but lacks an explicit `**Track:**` line.
  - **Why it matters:** Conflicts with the kanban convention in `CLAUDE.md`; unclear which plan is canonical.
  - **Suggested fix:** Add `**Track:**` and clarify whether this is a successor plan or an execution plan for promoting the older file.

#### Important (Should Address)

- **Phase 1 / verification**
  - **Problem:** Strong mutant list, but no explicit RED evidence capture per task beyond prose.
  - **Why it matters:** Project convention requires RED with captured failure output, not just intent.
  - **Suggested fix:** Add per-phase verification bullets: failing test file/selector, then green selector, then mutant.

- **Phase 2 / template selection**
  - **Problem:** Fallback rule depends on `campaignView` progress semantics, but assumes "first uncleared area" is always the right authoring target.
  - **Why it matters:** Could mis-serve templates for learners revisiting older areas or with sparse authored templates.
  - **Suggested fix:** State why this heuristic is correct for Journal authoring, or define a simpler explicit rule.

- **Phase 2 / empty Journal behavior**
  - **Problem:** The screen needs both journal entries and template data, but the plan does not mention partial-failure behavior if entries load and template 404s.
  - **Why it matters:** This is a likely real edge case since only areas 0 and 1 have templates today.
  - **Suggested fix:** Define UI behavior for template 404 separately from journal entry loading.

- **Phase 3 / Defend**
  - **Problem:** The plan adds mutation and outcome rendering, but does not specify post-drill state transition for queue rows.
  - **Why it matters:** Whether a resolved row updates in place, disappears, or triggers a queue reload is part of implementability.
  - **Suggested fix:** Specify the post-action state transition explicitly.

- **Phase 4 / a11y source guard**
  - **Problem:** "No `onClick` on a non-interactive element" is good, but the plan does not say how it will be enforced.
  - **Why it matters:** Without a concrete mechanism, this is vague compared with the rest.
  - **Suggested fix:** Name the exact test or static scan approach.

#### Minor (Consider)

- **Phase 2 / OverlandScreens deletion**
  - The import update in `apps/web/src/app/App.tsx` (or equivalent router) is not listed in Files Expected to Change. Should be named explicitly.

- **Lexicon**
  - The artboard's "Dad replied" is discussed correctly — the plan proposes "DM reply." No action needed beyond keeping the replacement explicit.

### Recommendations

- Make contract changes explicit and ordered before SPA/API tasks that depend on them.
- Add `**Track:**`, canonical-plan status, and dependency sequencing to satisfy plan-workflow conventions.
- Tighten edge-case handling for Journal template 404 and Defend post-action state.

### Assessment

**Implementable as written?** With fixes

**Reasoning:** The architecture is mostly sound, but the Submit phase relies on response behaviors not clearly represented by the current contract, and the plan/kanban sequencing needs clarification before implementation.
