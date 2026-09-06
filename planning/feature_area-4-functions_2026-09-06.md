---
kind: plan
status: queued
track: area-4
date: 2026-09-06
promoted_from: area-4-functions_2026-08-28
---

# Area 4 — Functions and Decomposition

**Status:** Planned
**Track:** area-4
**Date:** 2026-09-06
**Author:** Claude (Opus 5)
**Lane:** B
**Promoted from:** `planning/backlog/feature_area-4-functions_2026-08-28.md`

## Objective

Author weeks 15–20 — fifteen concepts across thirteen sessions, plus Boss 4 The Loop — as
two movements: he replaces the shim with his own `def`, then meets Pygame Zero, which
cannot be used at all until he can write one.

## Why this exists

Every previous area handed him something. **This is the first area that takes something
away, and it is his hand on it.** §4 schedules `BLOCKS` and `place()` for removal here, and
`curriculum/lib/README.md` says why the copy in his repository is a copy rather than a
dependency: "a file he owns is a file he can delete, and deleting it in Area 4 and Area 5
has to be his action, not the DM's." The whole *scaffolding retires on a schedule* argument
— the thing that separates this curriculum from CodeCombat, per the decision log — either
pays off in week 15 or it does not. The area should be authored around that moment rather
than around it arriving somewhere in the middle.

The vehicle then makes the case a second time and harder. Pygame Zero is not a library he
calls; it is a framework that calls **him**. `draw()`, `update()`, `on_key_down()` — the
entry points are functions he defines, so the vehicle is literally unusable before the area's
first concept. §4's sequencing rule is that each area's project makes the next concept
necessary. Here the project cannot start without it.

## Success Criteria

- [ ] `curriculum/area-4/` complete in the Area 0 layout, **thirteen sessions** — 12 or 14
      only by an explicit merge or split, named and argued in the README
- [ ] **All fifteen Area 4 concepts covered.** The stub says ten; `concepts.ts` says fifteen,
      and fifteen is the number, because `glossary-gap` counts that one. The README names the
      thinnest and says so honestly
- [ ] **The retirement is his, and the harness proves it happened.** An exercise in which he
      writes `def place(x, y, z, kind)` and his own `BLOCKS`, then deletes `import world` —
      and `verify.py` **fails any file after the retirement session that still imports
      `world`**. A schedule nothing checks is a wish
- [ ] **No exercise's logic imports pgzero.** Enforced, not asserted: `verify.py` blocks
      `pgzero` and `pygame` out of `sys.modules` before importing each logic module, and a
      module that reaches for either fails the run
- [ ] **No game file carries logic.** `verify.py` parses each `*_game.py` with `ast` and
      fails on any statement inside `draw`, `update` or an `on_*` handler that is not a call
      or an assignment from a call
- [ ] **Every exercise is deterministic** — run twice, identical output. Anything tagged
      `stdlib-random` or `stdlib-time` takes its nondeterminism as a parameter or a seed,
      which is `pure-vs-side-effecting` stated as a constraint instead of as prose
- [ ] `py -3.14 verify.py` reports N of N, headless, **with pgzero not installed** — see the
      contract below
- [ ] Five `a4-` quests plus Boss 4, all `local-repo`, plus the Area 4 VS Code rung as a
      `peer-signoff` quest. `npm run validate:content` exits 0
- [ ] **`curriculum/area-4/lesson.md`** — promoted from `lesson.draft.md`. Unlike Area 3's,
      this promotion is not only a rename; see *The draft is on the wrong vehicle* below
- [ ] Area 4 reported to the `main` track for the `curriculum/README.md` status table
- [ ] **Everything educational lands under `curriculum/area-4/`.** `game/area-4/quests/` gets
      the quest YAML and nothing else. `rm -rf game/` must still leave Area 4 valid and
      publishable

## Approach

**The fifteen concepts**, verbatim from `pyquest/packages/content/src/concepts.ts`:
`def` · `parameters` · `return` · `default-arguments` · `keyword-arguments` · `scope` ·
`docstrings` · `pure-vs-side-effecting` · `refactoring-a-script` · `import` ·
`stdlib-random` · `stdlib-math` · `stdlib-time` · `stdlib-pathlib` · `stdlib-json`.

**This track adds nothing to `concepts.ts`**, which is the one file the two lanes share.
Area 3's rung needed `breakpoints` registered and waited on `main` for it; Area 4's rung
does not, because "files gain functions worth navigating between" is `def` and
`refactoring-a-script` — ids that already exist, at this area, for this reason. Nothing here
is blocked on Lane A.

### Two vehicles, in this order

The area runs `world.py` for four sessions and Pygame Zero for nine. That is not a detour;
it is the ordering the two facts force.

**Sessions 1–4 — the retirement, on the world he already knows.** He has spent six weeks
calling `place(x, y, z, kind)`. He knows its behavior by heart, which means writing it is a
`def` exercise with the specification already in his head — the cheapest possible first
function. `BLOCKS` is a dict he has read since week nine. Then `import world` comes out of
his file and the tower still builds. Area 5 takes `start()` and needs `class World` to do it;
this plan does not touch that row.

**Sessions 5–13 — Pygame Zero.** It arrives once he can write a function, because it cannot
arrive before. Game loop, sprites, keyboard input, collision, score, per §4.

The sequencing has a scheduling payoff worth stating plainly: **the first four sessions need
no pgzero at all**, so roughly a third of the area — and the whole of its riskiest
pedagogical beat — can be authored while the viability spike is still open.

### The Pygame Zero gate

`planning/feature_pygame-zero-viability-spike_2026-09-06.md` is a separate plan on its own
track, filed alongside this one, and it is a **dependency rather than a phase**. The stub was
right about why: Ursina got its gate as a standalone spike in week 0, §4 rules out changing
vehicles mid-campaign, and discovering at week 15 that pgzero will not run costs six weeks.
A gate folded into this plan as Phase 0a could not run until the Area 4 track opened, which
is the failure the stub named.

**Stop/go, the shape Area 3 used for the block cap.** Until the spike lands:

- **Stop:** anything that opens a window or imports pgzero. No session 5–13 exercise, no
  reference solution, no Boss 4 brief, no screenshot.
- **Go:** `dm-guide.md`, the README outline, the concept spine, the invasion drills, the DC
  band, the quest matrix, `verify.py`, sessions 1–4 in full, and the parts of the later
  session plans that are about *decomposition* rather than *rendering* — a scoring function
  is a pure function whether or not anything draws it.

**The pin and the venv are the spike's to decide, not this plan's.** Whether pgzero
coexists with `ursina==8.3.0` in one environment or needs its own is one of the spike's four
checks. This plan consumes the answer and does not pre-empt it; `curriculum/lib/` is not in
*Files Expected to Change* below.

### The testability rule, which is also the lesson

Area 3's harness had one problem — `start()` blocks — and monkeypatched one seam. Pygame
Zero is worse in a way that turns out to be useful. `pgzrun` injects `screen`, `Actor`,
`keyboard`, `clock` and the rest into the module's globals and then *finds* `draw` and
`update` by name, so a pgzero file imported plainly raises `NameError` before it does
anything. There is no seam to patch.

**So the rule is that there is nothing to patch.** Every Area 4 exercise is a pair:

```text
exercises/<slug>/
  scoring.py        the logic. Pure functions. Imports nothing from pgzero
  scoring_game.py   draw(), update(), on_key_down() — each one a call into scoring.py
```

`verify.py` imports the logic module and asserts on return values. It never imports the
game file and never opens a window, so **the harness runs on a machine with no pgzero and no
display at all.**

This is Area 3's *the file he runs is the file the harness runs* holding in a stronger form,
and it is worth being explicit that the constraint is the curriculum rather than a
convenience: **a game whose logic lives inside `draw()` cannot be tested, and a game whose
logic lives in functions can.** That is `pure-vs-side-effecting` and
`refactoring-a-script` stated as a mechanism instead of as advice — the same argument §6.7
makes for the engine having no I/O, scaled down to a thirteen-year-old's game.

**`verify.py`, named rather than left to the implementer.** For each exercise, in order:

1. Insert `None` at `sys.modules['pgzero']` and `sys.modules['pygame']` so any import of
   either raises. Import the logic module. An `ImportError` here is a **failed exercise**,
   not a failed harness — the logic reached for the framework.
2. Call the functions named in the file's `# expect:` tag and compare against it, the way
   Area 0's harness compared pen-down moves.
3. Run step 2 a second time in the same process and require identical results. Anything
   tagged `stdlib-random` or `stdlib-time` that fails this is authored wrong, not flaky.
4. Parse the sibling `*_game.py` with `ast` — never execute it — and walk `draw`, `update`
   and every `on_*`. A statement that is not `Expr(Call)` or `Assign(value=Call)` fails.
   Loops, conditionals and arithmetic in a frame handler are exactly the thing this area
   exists to remove.

Plus the retirement grep from the success criteria: `import world` or `from world` anywhere
under `exercises/` or `reference/` **after session 4** fails the run. Before session 4 it is
required.

Rule 4 is deliberately strict and may be relaxed exactly once, argued in the README with the
file named. An escape hatch used twice is not a rule.

### DC band

Area 0 ran 5–18, Area 1 runs 8–20, Area 2 runs 5–22, Area 3 runs 10–24. **Area 4 runs
12–26.** The floor rises again for Area 3's reason carried forward: by week fifteen no
exercise is a single new idea. His first `def` is a def *and* parameters *and* a return
value *and* a dict he wrote, because a `place()` that takes no coordinates is not `place()`.

Boss 4 sits at **26**. It is a complete playable game plus a refactor that must not break
it, which is the first item asking him to change working code and prove it still works —
strictly harder than writing it once.

The band climbs visibly across six weeks: sessions 1–4 at 12–16, sessions 5–9 at 16–20,
sessions 10–13 at 20–24, boss at 26. The README records the number and the reason.

### Verifiers, and why Boss 4 is `local-repo`

Quests are `local-repo`; `scaffold.ts` already defaults there for any area above 1. §5.2's
target holds: **five quests, any three unlocking the boss.** Do not chain them.

**Boss 4 is `local-repo`, and the choice is the pedagogy rather than a convenience.** The
obvious objection is that "a complete playable 2D game" needs a person to play it, and Boss 2
set the precedent for a boss whose win condition a human observes. It does not apply here.
Boss 4's brief is a game *and then a refactor that does not break it*, and the refactor is
the graded half — §4's own framing. A submission whose logic is tangled into `draw()` cannot
be tested at all, so **the verifier failing to run is itself the correct verdict.** No
peer-signoff rubric grades decomposition that honestly.

Playability is not lost by this: §5.3's clean-clone rule binds every boss and the DM
enforces it as a standing rule, exactly as Area 3's plan reasoned. Three theme framings per
§5.2. `requires` is absent, per Areas 1 and 3 — the 3-of-5 rule is
`bossUnlocked(clearedQuestCount)` in the engine and nothing reads `requires`.

**One verifier per item, never two.** `VerifierSchema` is a discriminated union on `type`;
"`local-repo` + `peer-signoff`" is not expressible and the plan does not pretend otherwise.

### The VS Code rung

`tools/vscode/README.md` restores **Outline and breadcrumbs** at Area 4, because files gain
functions worth navigating between. A `peer-signoff` quest: the parent watches him jump
between three functions in a two-hundred-line file using the Outline view, then presses the
button.

**Half of this rung is blocked on something outside this track and it should be said here.**
`breadcrumbs.enabled` is a `settings.json` key and travels in the profile file. **Outline is
view visibility** — `globalState`, capturable only by exporting from a configured running
editor — and `planning/backlog/feature_vscode-profile-and-tool-quests_2026-08-28.md` records
that the shipped profile is hand-authored and carries a NOT YET VERIFIED banner for exactly
this reason. The quest can be authored now; it cannot be *run* until that one sitting at the
learner's laptop happens. That is a `blocked_on` for the rung alone and does not hold the
area.

### The quest matrix

Seven items: five quests, Boss 4, and the VS Code rung.

| id | Title | From | Primary concepts | Resurfaces | Verifier | DC |
|---|---|---|---|---|---|---|
| `a4-delete-the-import` | Delete The Import | session 3 | `def`, `parameters` | `dict`, `list`, `iteration` | `local-repo` | 12 |
| `a4-a-sensible-default` | A Sensible Default | session 5 | `default-arguments`, `keyword-arguments` | `def`, `parameters` | `local-repo` | 14 |
| `a4-the-outline` | The Outline | session 6 | `def`, `refactoring-a-script` | — | `peer-signoff: dm` | 12 |
| `a4-what-it-gives-back` | What It Gives Back | sessions 7 + 8 | `return`, `pure-vs-side-effecting`, `scope` | `def`, `if` | `local-repo` | 18 |
| `a4-borrowed-tools` | Borrowed Tools | session 10 | `import`, `stdlib-random`, `stdlib-math` | `return`, `parameters` | `local-repo` | 18 |
| `a4-the-long-script` | The Long Script | session 12 | `refactoring-a-script`, `docstrings` | all of them | `local-repo` | 22 |
| `a4-the-loop` | **Boss 4 — The Loop** | session 13 | all fifteen | everything | `local-repo` | **26** |

Six quests against §5.2's five, for Area 3's reason: the rung is a tool quest and should not
displace a functions quest. Any three of the five unlock the boss; the rung is elective depth.

**The `From` column is the sessions-to-quests relation, and Phase 5 records the resolved
version of it.** Thirteen sessions produce seven content items, and the two counts follow
different clocks on purpose: §5.2 fixes quests at five per area because *any three of five*
is a statement about his autonomy, while session count follows the material. So the relation
is many-to-one and lossy in both directions — `a4-what-it-gives-back` fuses two sessions
because neither drill alone carries a DC, and most drills never become quests at all. Area 1
already writes this down, in `curriculum/area-1/README.md` under *Which of these became
quests, and which did not*, down to the `s1e3 + s2e3` level; **Area 4's README carries the
same table, resolved to drill filenames once Phase 2 has named them**, plus its own *what was
deliberately not made a quest* section. Area 1's is the model there too: session 6's six
broken loops stayed DM-delivered because three fail silently and the win condition is that he
*says what is wrong*, which no verifier can check.

**File counts follow the verifier column.** `scaffold.ts` writes a starter only for
`hidden-tests`, which §6.3 confines to Areas 0–1, so **Area 4 ships no starters.** It writes
a test file for `hidden-tests` and `local-repo`, so the six `local-repo` items get one each
and the `peer-signoff` rung gets none: **seven YAML, seven briefs, no starters, six tests.**

`stdlib-pathlib` and `stdlib-json` are taught and drilled but carry no quest, and that is
honest rather than an oversight. At Area 4 they are *modules you import* — the point is
`import`, not persistence. Area 6 owns files, JSON as a format, and `pathlib` used in anger;
`json-format` is a separate Area 6 concept id for that reason. A quest here whose content is
"call `json.dumps`" would teach the wrong area's lesson badly.

### The draft is on the wrong vehicle

`curriculum/area-4/lesson.draft.md` is live and published today, and it is good prose with a
seam in it. It opens on the game loop — "it runs sixty times a second, and everything it does
has to be named, small, and findable" — and then teaches every example with `forward(size)`
and `right(90)`, which is Area 1's turtle vocabulary. He will not have a turtle in front of
him in week 15.

So **Area 4's promotion is a rewrite of the examples and then a rename**, where Area 3's was
a rename alone. The structure, the parameter-versus-argument distinction, the five-step
refactoring method and the scope section all survive; the code blocks move to `place()` and
then to the game loop the opening paragraph already promised. As with Area 3, the rename may
only happen once the sessions exist to have tested the prose against a real evening — a draft
promoted without a session behind it is the "authored, plausible, never run" failure this
repository keeps finding.

One thing the draft gets right and must keep: that "sixty times a second" line. The
`pace-in-lesson` validator excludes minutes and seconds from its calendar sweep and its
comment names this area to explain why — the game loop's frequency is the subject, not a
claim about how long the reader has been at this. A rule that swept it up would fail the one
lesson that most needs to say it.

## Phases

### Phase 1 — the DM guide, and the spine

`dm-guide.md` first, as always. Named stalls for this area, each with the exact question:

- the function that computes correctly and returns `None`, because he printed instead
- the mutable default argument, which he will hit the first time a default is a list
- the global he assigned to inside a function and could not find afterward
- `place(...)` called on the line above `def place(...)` — definition runs nothing
- `draw()` spelled `Draw()`, so pgzero never calls it and nothing at all happens
- the sprite that moves at a different speed on a different machine, because `update()` was
  written against frames instead of `dt`

Invasion drills now span Areas 0 through 4 — fifty-four concepts on the 1/3/7/16/35 ladder.
**The selection rule is Area 3's and this guide cites it rather than restating it**; a rule
written twice is a rule that drifts. What Area 4's guide adds is the one thing the rule
cannot know: which concepts this area deliberately drills most, and why.

**The spine is the last deliverable of Phase 1** and it is what makes Phase 2's split real.
Five things, per Area 3:

1. **Session count and titles** — thirteen.
2. **The concept resurfacing map** — which concept is re-touched where.
3. **The DC band per session block** — 12–16, 16–20, 20–24, boss at 26.
4. **The quest beats** — which session each of the seven items attaches to.
5. **The retirement line** — which session deletes `import world`, since `verify.py`'s grep
   is a before-and-after rule and needs a number.

### Phase 2 — sessions and exercises, in two halves [ASYNC internally, and one half is gated]

**Sessions 1–4, the retirement half, are not gated** and should be authored first: they need
`world.py`, which exists and is measured, and they carry the area's argument. **Sessions
5–13 are behind the Pygame Zero gate.**

Roughly 35–45 `.py` files, each carrying `# concepts:`, `# dc:`, `# expect:`, tagging what it
resurfaces as well as what it introduces. From session 5 they come in pairs — logic and game
file — and the pair is the unit `verify.py` checks.

Reference solutions in `reference/` are Datamine payloads under §5.5, the DM's copy.

### Phase 3 — `verify.py`

Headless, and with no pgzero installed. The four steps above, plus the retirement grep. It
should be written before session 5 rather than after session 13, because rules 1 and 4 are
authoring constraints and an author who discovers them late has files to rewrite.

### Phase 4 — the content items

Five quests, Boss 4, and the Outline rung. Scaffold, fill, write the hidden tests,
`validate:content` to zero. Boss 4 needs three theme framings and no `requires`.

### Phase 5 — README, journal, board

Session table, the ordering argument, the two-vehicle sequencing, the DC choices, concept
coverage, the verify count, the retirement session number and what the harness does about it
— all in `curriculum/area-4/README.md`. Journal entries continue. Report the status line to
`main` for `curriculum/README.md` rather than editing the index.

**Two tables that only exist at this phase**, both modeled on Area 1's README: the resolved
`From` mapping at drill granularity, and *what was deliberately not made a quest* with the
reason for each. The second one is the harder to write and the more valuable — an area that
lists only what it shipped cannot be audited for what it dropped.

## Dependencies / Prerequisites

- **`feature_pygame-zero-viability-spike_2026-09-06.md` must land before sessions 5–13.**
  Filed alongside this plan, on its own track so it can run while Area 3 is still teaching.
  It owns four questions: pgzero installs under 3.14, it opens a window on the learner's
  laptop, `pgzrun` works from a plain `python thing.py` (Area 2b vocabulary, not a bespoke
  runner), and whether it shares a venv with `ursina==8.3.0` or needs its own. **This plan
  consumes those answers and does not decide them.**
- **`curriculum/lib/world.py` is copied into his repository**, done at Area 3 start per
  `curriculum/lib/README.md`. Sessions 1–4 delete *that* copy's import. **This track never
  edits `curriculum/lib/`**; the canonical shim is unchanged and Area 5 still needs it.
- [x] **The concept ids exist.** All fifteen are registered at area 4 and the rung reuses
  `def` and `refactoring-a-script`. Nothing to add, nothing to wait for.
- **Area 3 authored and Boss 3 cleared**, or week 13 — the stub's promotion trigger, and the
  reason this plan is queued rather than in-progress.
- The VS Code profile verified on the learner's laptop, **for the rung only**. See above.

## Files Expected to Change

- `curriculum/area-4/sessions/**` — new: thirteen session plans, each with its `session-<n>/`
  directory of drills beside it
- `curriculum/area-4/exercises/<slug>/**` — new, **seven**: `BRIEF.md` for every item and
  `hidden/test.py` for the six `local-repo` ones. **No `starter/`** — starters are a
  `hidden-tests` artifact and §6.3 confines that to Areas 0–1
- `curriculum/area-4/lesson.md` — **promoted from `lesson.draft.md`**, with its examples moved
  onto this area's vehicles first. Not a bare rename
- `curriculum/area-4/glossary.md` — **held, not created.** All fifteen `## <id>` sections
  already exist and `glossary-gap` is already satisfied. Touched only if the lesson's marks
  change
- `curriculum/area-4/area.yml` — **held, not created.** This plan flips `authoring: partial`
  to `complete` when the five quests exist, which is an edit to one word
- `curriculum/area-4/{README.md,dm-guide.md,verify.py}`, `reference/**`, `journal/**` — new,
  the Area 0 layout
- `game/area-4/quests/a4-*.yml` — new, **seven**: five quests, the Outline rung, and Boss 4

Each quest's `brief:` and `verifier.tests:` are paths **into the curriculum root**, of the
form `area-4/exercises/<slug>/BRIEF.md`. That cross-root reference is validated; a typo is a
failed `validate:content` rather than a broken page.

**Owned by other tracks, not this one:** `curriculum/README.md` (`main`), `curriculum/lib/**`
(the shim, and Area 5's retirement of `start()`), `tools/vscode/**` (Area 2's Phase 3), and
`pyquest/packages/content/src/concepts.ts` (Lane A). The Area 4 rung ships here and is
recorded in `curriculum/area-4/README.md`; the status table is written once, by the track
that owns it.

## Out of Scope

`start()` and `class World`. Area 5 takes the last row of the removal schedule and needs
`class` to do it. An Area 4 exercise that reaches for it is teaching Area 5's material six
weeks early.

Saving and loading anything. `pathlib` and `json` are imported here to demonstrate `import`;
files, context managers and JSON as a data format are Area 6, which is why `json-format` is
a separate id at that area.

Making these playable in a browser. Pygame Zero needs SDL and a real display; Pyodide has
neither. Area 4 is `local-repo` and that is the design, not a limitation — and it is the
reason the logic/game split above matters, since the logic half is the half a grader can
reach.

Anything under `pyquest/` or `infra/`.

## Verification

Run from the repository root unless noted.

```console
py -3.14 curriculum/area-4/verify.py          # N of N, headless, pgzero absent
py -3.14 -m ruff check curriculum/area-4
py -3.14 -m ruff format --check curriculum/area-4
py -3.14 -m pyright curriculum/area-4
```

From `pyquest/`:

```console
npm run validate:content                       # exits 0
npm run validate:plans                         # this document and the stub agree
npm test -w @pyquest/content                   # includes the rm -rf game/ deletion test
```

Then the checks a command cannot make:

- **The retirement, end to end.** On the learner's copy of the repository: complete the
  session 3 exercise, delete `import world`, run the file, watch the tower still build.
  Confirm `verify.py` fails if the import is put back.
- **The gate.** Boss 4's submission clones clean onto the other machine and its tests run
  there — §5.3, and the whole point of `local-repo`.
- **The rung.** Outline and breadcrumbs actually visible in the profile on his laptop, which
  is the item the VS Code stub says is still unverified.

## Board moves this plan implies

- This document lands at `planning/feature_area-4-functions_2026-09-06.md` — queued plans
  live at the board root.
- `planning/backlog/feature_area-4-functions_2026-08-28.md` becomes
  `promoted_area-4-functions_2026-08-28.md` with `status: promoted` and
  `promoted_to: area-4-functions_2026-09-06`. The filename prefix and the status have to
  agree or `validate:plans` fails.
- `planning/feature_pygame-zero-viability-spike_2026-09-06.md` — new, queued, on its own
  track so it never contends with `area-4` or `main` for the one-in-progress-per-track slot.
