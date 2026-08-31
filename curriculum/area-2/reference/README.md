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

## What is here, and it is all 2b

Sessions 5–8 are a different matter, because from session 5 there are right answers that
are not obvious from the walkthrough.

### `its-own-python/` — the worked venv project

`main.py`, `requirements.txt`, `README.md`: the smallest honest answer to
`a2-its-own-python`. A program that cannot run without something installed, and four
commands that build the environment it needs.

**Unlock it only after he has built a venv of his own and failed at it**, which is the
normal Datamine rule and matters more here than usual — the value of session 7 is entirely
in the `ModuleNotFoundError` he causes himself.

Its README also records the measured version of the two-interpreter trap, including the
part that catches adults: **inside an activated environment, `py -3.14` is not the
environment.**

### `session-8-answers.md` — the traceback answer key

In the shape of Area 0's `session-3-answers.md`, and used the same way: **read it before
session 8, never in front of him.** Every traceback in it was captured by running the file
on Python 3.14.6, and it carries the six written answers the walkthrough asks for.

This is the one payload in the area that is for the DM rather than for unlocking. There is
nothing in it he could be given that would help — the skill is reading a stack, and being
handed a read one removes the exercise entirely.

## Verifying these still run

Anything `.py` that lands here is covered by the area harness along with the exercises:

```
py -3.14 verify.py
```

**With one stated exception, and the harness says it out loud.** Files under a directory
holding a `requirements.txt` are **not run**: they have an environment of their own and the
harness does not have it. That is `its-own-python/main.py`, and it is the only one. Delete
that `requirements.txt` and the harness will try, and fail with `ModuleNotFoundError` —
which is the correct answer to being asked, and is how the rule was proved.
