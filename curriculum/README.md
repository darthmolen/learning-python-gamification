# Curriculum

The teaching material itself — session plans, exercises, and the Journal. Prose and
Python, delivered by a parent to one learner.

**This directory has no dependency on the application.** Every area here must be
runnable with a text editor, a terminal, and Python. That is a standing constraint, not
a temporary state of affairs: spec §8 warns that if the curriculum waits on the app,
*the app becomes a satisfying way to postpone teaching a child Python*.

Content for the game engine — quest YAML, briefs, hidden tests — lives in
`packages/content/` and is authored separately. Each area's README records which of its
exercises should later become quests, and of what kind.

| Area | Weeks | Subject | Status |
|---|---|---|---|
| [area-0](area-0/) | 1–2 | First Light — `print`, variables, the four types, `input`, f-strings, reading errors | **authored** |
| area-1 | 3–6 | Control — `if`/`while`/`for`, nesting, the accumulator pattern | not started |

Spec: `docs/specs/2026-08-26-gamified-python-curriculum-design.md`.

## Conventions

Established by Area 0 and worth keeping.

- **One directory per area**, holding `README.md`, `dm-guide.md`, `verify.py`,
  `sessions/`, `exercises/`, `journal/`, `reference/`.
- **Every exercise `.py` carries three header tags** — `# concepts:`, `# dc:`,
  `# expect:` — and an optional `# stdin:`. Concept ids come from
  `packages/content/src/concepts.ts` verbatim, and tag what a file *resurfaces* as well
  as what it introduces, because spec §5.4 schedules retrieval off them.
- **Every area has a `verify.py`** that runs every exercise and checks it against its own
  tags. A curriculum whose exercises are not known to run is not delivered.
- **Shipped exercise code runs and does something, but is never the answer.** Reference
  solutions live in `reference/` and are the parent's copy — they are Datamine payloads
  under spec §5.5, not handouts.
- **The parent guide predicts named stalls and gives the exact question to ask.** "Ask a
  Socratic question" is not usable advice at 7pm on a Tuesday.
