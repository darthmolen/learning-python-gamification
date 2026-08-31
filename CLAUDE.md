# Working on PyQuest

A gamified Python curriculum for one parent and one son, run over ~48 weeks.
**The real work is the curriculum; the game wraps it.**

Read [`docs/specs/2026-08-26-gamified-python-curriculum-design.md`](docs/specs/2026-08-26-gamified-python-curriculum-design.md)
before changing anything. It is the document of record and it settles most arguments.
Layout and commands: [`README.md`](README.md).

## Two lanes

Work runs in two lanes that do not block each other. Say which one you are in.

**Lane A — the game and the systems under it.** `pyquest/` (engine, content tooling,
API, SPA), `infra/`. Dependency order: the engine's query layer and the Postgres schema
both block the API; the SPA does not wait for the API — it builds against the shared
contract with stubs.

**Lane B — content and curriculum.** `content/` (quest YAML, briefs, hidden tests) and
`curriculum/` (session plans, exercises, DM guide). No code dependency, ever. Lane B is
what actually teaches a child Python, so it is never the thing that gets postponed.

Lane B depends on Lane A in exactly one direction: authored content is validated against
`pyquest/packages/content/src/concepts.ts`. If a concept id changes, content breaks —
that is `validate:content` doing its job. Fix the content, never loosen the validator.

## Solution shape

```
content in git  ──►  engine (pure)  ──►  api  ──►  spa
progress in postgres ──────────────────►
```

- **The engine has no I/O, no database, no network** (§6.7). It is the one component
  that must never be wrong, which is why it is the one that is trivially testable. The
  package boundary is what enforces this — do not dissolve it.
- **Content lives in git. Progress lives in Postgres. The two never mix.**
- **Push is the verification mechanism** (§6.4). The API is on the parent's machine and
  the code is on the son's; `git push` is how it travels.
- **Run and Submit are different paths.** Run is Pyodide in the browser. Submit goes to
  the API, because hidden tests shipped to the client are not hidden.
- The engine returns numbers; **presentation decisions live in the UI** — the DC ≥ 20
  warning, a zero payout rendering as "brag", the `~` on an estimated total.

## The lexicon — one vocabulary, everywhere

Spec, schema, engine, curriculum and UI use the same words. At Boss 7 he opens this
repository and reads them. **Do not reintroduce the old ones.**

| Use | Never |
|---|---|
| Area (0–7) | Tier |
| Invasion | Patrol |
| Defend | Muster |
| Journal | Chronicle |
| Party | Board, Levels |
| Tome | Learn, Codex |
| `peer` / `dm` | `parent`, `son` as roles |

The current arrangement is **Kitchen Table mode**: one household, the parent holding
both the player and DM seats (§5.11). Roles are not people.

## UI rules these screens commit to

- Every sub-area carries a **breadcrumb**, and it is the way back. A crumb names the
  activity, not the object.
- **Labels never change with state.** "Take it cold" was false on a screen showing three
  quests cleared.
- **No pop-overs.** The Tome expands in place and pushes the work down; nothing is
  covered and nothing is lost.

## How to work

- **Tests first, and prove they can fail.** Follow `test-filter-development`: RED with
  the failure output captured, GREEN, then seed a mutant and confirm the suite catches
  it. A check you have not seen fail is worth nothing — three of ours were wrong rather
  than the code.
- **Python quality:** use the `python-quality-developer` skill for any `.py` — ruff and
  pyright clean, no `Any`, exception chaining. This is not housekeeping: §5.10's
  **Idiomatic medal** is literally "ruff and pyright clean", so the standard the learner
  is graded against is the standard the repo holds itself to.
- TypeScript work: `typescript-pro`. The SPA: `react-specialist`.
- **Planning is kanban** (`plan-workflow`): plans live in `planning/`, move to
  `in-progress/`, end in `completed/` with a Status block. Every plan declares a
  `**Track:**` — `main` unless a sub-agent owns it — and `in-progress/` holds one plan
  per track, with disjoint `Files Expected to Change`.
- **Run every npm command from `pyquest/`.** Use `py -3.14`, never `python` — it is 3.12
  in PowerShell and 3.14 in Git Bash on this machine.
- Prefer the Bash tool over PowerShell here; PowerShell is slow in this environment.
- **Write file content with the Write tool, never `cat <<EOF`.** ⚠️ Choking hazard. A
  heredoc escapes for two languages at once and the result still compiles: a regex path
  separator and a `\b` that JavaScript read as a backspace both shipped gates that passed
  while measuring nothing, twice in one day. Long heredocs also die outright on
  "unexpected EOF" for no reason anyone has reproduced. Heredocs are for commit messages.
- Do not commit or push unless asked.
