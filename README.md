# PyQuest

A gamified Python curriculum for one parent and one son, run over about 48 weeks.
The real work is the curriculum; the game wraps it.

Design: [`docs/specs/2026-08-26-gamified-python-curriculum-design.md`](docs/specs/2026-08-26-gamified-python-curriculum-design.md)

## Layout

| Directory | What is in it |
|---|---|
| `pyquest/` | **The application.** npm workspace root — run every `npm` command from here |
| `content/` | Authored quest data: YAML, briefs, starters, hidden tests. Loaded by the app, written by the DM |
| `curriculum/` | Teaching material for humans: session plans, exercises, the parent guide. Needs no software to use |
| `docs/specs/` | The design spec. The document of record |
| `docs/design/` | UI artboards for the Claude Design canvas |
| `infra/` | Docker Compose, backup and restore, the smoke check |
| `planning/` | The kanban: queued, `in-progress/`, `completed/`, `backlog/` |
| `spikes/` | Throwaway experiments, kept as a record. Nothing here ships |

`content/` and `curriculum/` sit outside `pyquest/` on purpose: both are authored by a
person rather than compiled, and the app is one of their consumers rather than their
owner.

## The application

```
pyquest/
  packages/
    engine/           pure functions over state and content — no I/O, no database,
      src/            no network. Spec §6.7: the one component that must never be
      tests/          wrong, which is why it is the one that is trivially testable
    content/          the content contract, its validator, and the authoring CLI
      src/
      tests/
      fixtures/       deliberately broken content roots — the validator is worth
                      exactly what it refuses, so the refusals are tested
```

Tests live in `tests/` beside `src/` rather than interleaved with it. Vitest resolves
cross-package imports to source, never to `dist/`, so a suite cannot pass against a
stale build.

## Running it

Everything runs from `pyquest/`:

```bash
cd pyquest
npm install
npm test                 # 98 tests
npm run typecheck
npm run validate:content # the authored content in ../content
npm run new:quest -- --id a3-shulker-sort --title "Shulker Sort" --area 3 \
                     --concepts sorted,min,max --dc 14
```

The stack runs from `infra/`:

```bash
cd infra
cp .env.example .env
docker compose up -d     # postgres and gitea
./smoke.sh               # health, plus a real backup and restore rehearsal
```

The curriculum needs only Python:

```bash
py -3.14 curriculum/area-0/verify.py
```

> On this machine `python` is 3.12 in PowerShell and 3.14 in Git Bash. Use `py -3.14`.

## Licence

GPL-3.0-or-later. See [LICENSE](LICENSE).
