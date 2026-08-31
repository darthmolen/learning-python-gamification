# The game overlay

The game's view of the curriculum: which exercises are scored, what they are worth, and what
counts as passing. **Everything educational lives in [`../curriculum/`](../curriculum/)** —
this tree holds no teaching, and deleting it must leave a curriculum that still validates and
still publishes.

That is not a slogan. `packages/content/tests/two-roots.test.ts` performs the deletion and
asserts the result, so a dependency that crept the wrong way would fail a test rather than a
principle.

Spec §6.7 draws the other line this directory sits on: **content lives in git, progress lives
in Postgres, and the two never mix.** Nothing in here describes a player.

## Layout

```text
game/
  area-<n>/
    quests/        one YAML file per content item: quest, invasion, or boss (§6.2)
    transcripts/   canned AI conversations for the Scrollcraft arc (§6.2)
```

## Paths point out of this tree

A quest names its brief, its starter and its hidden tests, and all three live in the
curriculum:

```yaml
brief: area-1/exercises/the-countdown/BRIEF.md
verifier:
  type: hidden-tests
  starter: area-1/exercises/the-countdown/starter/unfinished.py
  tests: area-1/exercises/the-countdown/hidden/test.py
```

**Those paths are relative to the curriculum root, not to this one.** A transcript path is
relative to *this* root, because a transcript is the game's own record. The validator resolves
each field against the tree that owns it and refuses anything that does not exist, so a typo
here is a failed `validate:content` rather than a broken page.

Absolute paths and `..` segments are refused by the schema: content may not reach outside its
root.

The file name of a quest does not matter to the loader — the `id` field is the identity, and
`requires` and every progress row reference that. Naming the file after the id anyway is what
`npm run new:quest` does, because a directory sorted by id is a directory you can read.

## Working here

```bash
npm run new:quest -- --id a3-recipe-book --title "The Recipe Book" --area 3 --concepts dict,iteration --dc 12
npm run validate:content
```

`new:quest` scaffolds the YAML and its brief and stubs, wired so the result validates with no
hand-editing. `validate:content` is the gate: it proves the prerequisite graph is acyclic,
every concept tag is known, every referenced file exists in the tree that owns it, and no quest
tags vocabulary from an area above its own. It exits non-zero on any of those, and it is meant
to be run constantly.
