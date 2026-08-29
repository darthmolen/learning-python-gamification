# Reference — Datamine payloads

**This directory is yours, not the learner's.** Do not copy it onto the learner's machine.

Spec §5.5 defines **Datamine**: after two genuine attempts and one written sentence about
what he tried, he may unlock the answer. It is a legal, named, costed move — not cheating
and not a failure. The five rules that come with using one are in Area 0's
`reference/README.md` and they are unchanged here.

## What is deliberately not here

**Nothing for sessions 1–4, and that is not an oversight.**

A git walkthrough's answer is the next line of the walkthrough. There is no reference
solution to unlock for "make a commit, then read the log", because the walkthrough already
tells him what to type — the difficulty is entirely in understanding what happened, and
handing him a worked copy of a thing he already has would unlock nothing.

**When he is stuck in 2a he is not stuck on knowledge.** He is stuck on *where he is
standing* — which directory, which branch, which commit — and the fix is a question about
location, not an answer. `dm-guide.md` §4 has the question for each of them.

The one Datamine-shaped moment in 2a is a merge conflict, and the payload for that is the
conflict markers themselves, which are already in his file.

## What will be here

Sessions 5–8 are a different matter, and their reference material arrives with them:

- a worked `its-own-python/` project — `main.py`, `requirements.txt`, `README.md` — as the
  payload for the venv quest, which is the first thing in this area with a right answer
  that is not obvious
- a traceback answer key for session 8, in the shape of Area 0's
  `reference/session-3-answers.md`, quoting real multi-frame stacks with their line
  numbers

Both are Phase 4 of `planning/in-progress/feature_area-2-scribes-rite-and-sandbox_2026-08-28.md`
and neither exists yet.

## Verifying these still run

Anything `.py` that lands here is covered by the area harness along with the exercises:

```
py -3.14 verify.py
```
