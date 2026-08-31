# Curriculum

The teaching material itself — session plans, exercises, and the Journal. Prose and
Python, delivered face to face by whoever holds the DM seat — in the arrangement this was
built for, a parent.

**This directory has no dependency on the application.** Every area here must be
runnable with a text editor, a terminal, and Python. That is a standing constraint, not
a temporary state of affairs: spec §8 warns that if the curriculum waits on the app,
*the app becomes a satisfying way to postpone teaching a child Python*.

**`lib/` is the one thing here that is not an area, and it is the one exception to that
constraint.** It holds `world.py` — the three-name Ursina shim Areas 3 to 5 import and then
progressively delete — and it carries a pytest suite, `ruff` and `pyright`, because it is
code a learner *depends on* rather than code they write. The constraint still binds
everything they touch: `lib/smoke.py` needs nothing but Python and ursina, so the check that
matters on the learner's machine runs there as it stands. The test suite is the DM's.

**Everything educational lives here, including the briefs, starters and hidden tests the
game scores.** They sit under `area-<n>/exercises/<slug>/` — `BRIEF.md`, `starter/` and
`hidden/` — beside the sessions that teach them. The game's own overlay is
[`../game/`](../game/): which exercises are scored and what they are worth, and nothing else.
Deleting it leaves this tree intact, which is the arrangement the split exists to guarantee.

Each area's README records which of its exercises should later become quests, and of what
kind.

| Area | Weeks | Subject | Status |
|---|---|---|---|
| [area-0](area-0/) | 1–2 | First Light — `print`, variables, the four types, `input`, f-strings, reading errors | **authored** |
| [area-1](area-1/) | 3–6 | Control — `if`/`while`/`for`, nesting, the accumulator pattern | **authored** |
| [area-2](area-2/) | 6–8 | The Scribe's Rite, and Escape the Sandbox — git, then the real toolchain | **2a authored**; 2b blocked on hardware verification |
| area-3 | 9–14 | Collections — `list`, `dict`, `set`, iteration, nested structures | planned, blocked on the shim's measurement |

Area 2's remaining half needs one sitting at the machine the profile is for: the VS Code profile has to be
imported and confirmed there before sessions 5–8 can be finalised. Five of its strips are
view-visibility state rather than settings keys, so they can only be captured by exporting
from a configured running editor — that step produces them, it does not merely check
them. Area 3 waits on `curriculum/lib/`'s framerate measurement on the same machine.

Spec: `docs/specs/2026-08-26-gamified-python-curriculum-design.md`.

**The status table above is written by the `main` track, not by the area tracks.** Every
area plan wants to mark its own row when it finishes, and the moment two of them run in
parallel that is a collision on one file — `plan-workflow` admits a plan to `in-progress/`
only when its `Files Expected to Change` is disjoint from every other in-progress plan's.
So an area reports its status to `main` and `main` writes the row. If you are executing an
area plan and reaching for this file, that is the sign you have picked up something the
plan does not own.

## Conventions

Established by Area 0 and worth keeping.

- **One directory per area**, holding `README.md`, `dm-guide.md`, `verify.py`,
  `sessions/`, `exercises/`, `journal/`, `reference/`.
- **Every exercise `.py` carries three header tags** — `# concepts:`, `# dc:`,
  `# expect:` — and an optional `# stdin:`. Concept ids come from
  `pyquest/packages/content/src/concepts.ts` verbatim, and tag what a file *resurfaces* as well
  as what it introduces, because spec §5.4 schedules retrieval off them.
- **Every area has a `verify.py`** that runs every exercise and checks it against its own
  tags. A curriculum whose exercises are not known to run is not delivered.
- **Shipped exercise code runs and does something, but is never the answer.** Reference
  solutions live in `reference/` and are the DM's copy — they are Datamine payloads
  under spec §5.5, not handouts.
- **The DM guide predicts named stalls and gives the exact question to ask.** "Ask a
  Socratic question" is not usable advice at 7pm on a Tuesday.
- **The learner is never `he`.** The voice depends on who is being addressed, and
  conflating the two is what makes a sweep read badly:

  | Audience | Files | Voice |
  |---|---|---|
  | The learner | `exercises/`, `journal/`, `area-<n>/exercises/*/BRIEF.md` | **Second person.** "You will type this and it will fail" |
  | The DM | `dm-guide.md`, `sessions/`, `reference/`, area `README.md` | **Singular *they*** for the learner — "you" is already the DM |
  | Either, when ambiguous | anywhere | `the learner`, which is stiff enough to earn its place only where *they* could mean the DM |

  This convention is not invented here. The briefs already address the learner
  directly and has never needed a pronoun; the rest of the corpus is catching up to the
  half that got it right. *"He or she"* is rejected — it is dated, it doubles the word
  count in a document read at 7pm on a Tuesday, and it still leaves people out.
  Quotations are exempt and must stay verbatim, but must also be visibly quotations.
- **The arrangement is stated once, in the `dm-guide.md`, and not re-implied by every
  pronoun after it.** This was built for one household — a parent and an 11–14-year-old —
  and §2.4 counts a parent in the room as the design's single largest advantage, so the
  relationship is worth naming where that argument is being made. Naming it once is what
  lets every other page speak to whoever is actually holding the book.
