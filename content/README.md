# The content root

Authored curriculum content. Spec §6.7 draws the line this directory sits on: **content lives
in git, progress lives in Postgres, and the two never mix.** Nothing in here describes a
player.

## Layout

| Directory | Holds |
|---|---|
| `areas/` | One area manifest per area, `area-<n>.yml` — the denominator of §5.1a |
| `quests/` | One YAML file per content item: quest, invasion, or boss (§6.2) |
| `briefs/` | The markdown brief each item points at |
| `starters/` | Starter files for `hidden-tests` verifiers |
| `tests/` | Hidden test files. These never reach the browser (§6.3) |
| `transcripts/` | Canned AI conversations for the Scrollcraft arc (§6.2) |

**Every path inside a YAML file is relative to this directory**, exactly as the §6.2 example
writes them (`briefs/a3-recipe-book.md`). Absolute paths and `..` segments are refused by the
schema: content may not reach outside the content root.

The file name of a quest does not matter to the loader — the `id` field is the identity, and
`requires` and every progress row reference that. Naming the file after the id anyway is what
`npm run new:quest` does, because a directory sorted by id is a directory you can read.

## Working here

```
npm run new:quest -- --id a3-recipe-book --title "The Recipe Book" --area 3 --concepts dict,iteration --dc 12
npm run validate:content
```

`new:quest` scaffolds the YAML and its brief and stubs, wired so the result validates with no
hand-editing. `validate:content` is the gate: it proves the prerequisite graph is acyclic,
every concept tag is known, every referenced file exists, and no quest tags vocabulary from a
area above its own. It exits non-zero on any of those, and it is meant to be run constantly.
