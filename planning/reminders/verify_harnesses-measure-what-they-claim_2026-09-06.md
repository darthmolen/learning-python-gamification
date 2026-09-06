---
kind: reminder
status: open
date: 2026-09-06
---

# Check that each verify.py still finds the files it claims to

**Category:** verify
**Discovered:** 2026-09-06, while looking for a harness to model Area 3's on
**Owned by:** whoever next touches the curriculum tree layout

## What happened

Commit `80e41a3` moved every drill from `exercises/session-<n>/` to `sessions/session-<n>/`.
No `verify.py` had its `SEARCH` tuple updated, so all three kept searching a directory that
now holds only starters and hidden tests — neither of which carries the header tags the
harness checks.

| Area | README claimed | Actually reported | Drills unchecked |
|---|---|---|---|
| 0 | 19 of 19 | **2 of 22** | 17 |
| 1 | 35 of 35 | **5 of 15** | 30 |
| 2 | 13 of 13 | **0 of 2** | 13 |

Sixty drill files were being verified by nothing. Fixed the same day, one line per file.
All three returned to exactly the numbers their READMEs already claimed, so the
documentation had been right the whole time and the gates had drifted away from it.

Evidence: `planning/evidence/verify-search-drift-BEFORE.txt` and
`verify-search-drift-GREEN-and-MUTANT.txt`.

## Why it survived so long, which is the part worth remembering

**The failures were loud.** Every run printed rows like

```text
FAIL  unfinished.py    no `# expect:` tag
```

The gates were shouting on every invocation. What nobody re-read was the count on the last
line, because each README quoted a number that was still *true* — it had simply stopped
being *measured*. A stale-but-correct number is much harder to notice than a wrong one.

## The check to actually perform

**Any time the curriculum tree moves — any time files change directory — run every
`verify.py` and compare its total against the number written in that area's README.**

```console
cd curriculum/area-0 && py -3.14 verify.py   # expect 19 of 19
cd curriculum/area-1 && py -3.14 verify.py   # expect 35 of 35
cd curriculum/area-2 && py -3.14 verify.py   # expect 13 of 13, 1 skipped, 8 walkthroughs
cd curriculum/area-3 && py -3.14 verify.py   # expect 17 of 17
```

A count that dropped is a harness that lost its files, not a curriculum that broke.

## Worth considering, not yet decided

A test that asserts each `verify.py` finds a non-trivial number of files would catch this
class of failure automatically. It would live under `pyquest/` and so belongs to Lane A,
and it is not obviously worth the coupling — a Python harness asserted by a TypeScript
suite is a seam that has to be maintained. Recorded as an option rather than a plan.

Cheaper alternative, entirely within the curriculum tree: have each `verify.py` refuse when
it finds fewer files than a floor written into it. Area 3's already refuses on an empty
tree and exits 1 rather than printing a reassuring `0 of 0`; a floor is the same idea with
a number on it.

## Done when

- [ ] The four counts above have been re-checked after the next tree move
- [ ] A decision recorded on whether a floor per harness is worth adding
