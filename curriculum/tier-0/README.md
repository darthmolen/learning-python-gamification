# Tier 0 — First Light

**Weeks 1–2. Six sessions of 45–60 minutes.**
Spec: `docs/specs/2026-08-26-gamified-python-curriculum-design.md`, §4 Tier 0.

`print` · `variables` · `int` `float` `str` `bool` · `input` · `f-strings` · reading errors

**Vehicle: turtle graphics.** The first line he types draws something.

This tier needs a text editor, a terminal, and Python 3.14. It needs no application, no
server, no browser and no internet. That is deliberate — spec §8 warns that if Tier 0
waits on Phase 1, *the app becomes a satisfying way to postpone teaching a child Python*.

---

## Read in this order

1. **`parent-guide.md`** — how to run a session, and the Socratic phrasings for every
   stall predicted here. Read this before session 1. It is the load-bearing document.
2. **`sessions/session-1-first-light.md`** — then one per session, on the night.
3. **`reference/session-3-answers.md`** — before session 3. Not during.
4. **`chronicle/entry-01-prompt.md`** — at the end of session 1.

---

## The sessions

| # | Title | Concepts introduced | Resurfacing | Files |
|---|---|---|---|---|
| 1 | **First Light** | `print` | — | `s1e1`, `s1e2`, `s1e3` |
| 2 | **Names For Things** | `variables`, `int` | `print` | `s2e1`, `s2e2` |
| 3 | **The Broken Sigil** | `reading-errors` | `print`, `variables`, `int`, `str` | `b1`–`b7`, `error-log.md` |
| 4 | **Four Kinds Of Thing** | `float`, `str`, `bool` | `int`, `variables`, `print` | `s4e1`, `s4e2` |
| 5 | **The Machine Asks** | `input`, `f-strings` | `str`, `int`, `variables`, `print` | `s5e1`, `s5e2` |
| 6 | **The Commission** | — | all nine | `commission-brief.md`, `s6_starter.py` |

### Why this order

**Errors come third, not last.** Every platform surveyed in spec §2.3 treats error
messages as an interruption to teaching. Here they *are* the teaching, and they land at
session 3 because by then he has already caused four or five by accident and has a
grievance. A concept he already resents is the cheapest one to teach.

Session 3 also arrives before `input`, which matters: session 5 breaks his own program in
two ways he cannot fix yet, and he can only find that interesting rather than
demoralising if he already knows how to read what fell out.

**Types come fourth, not first.** Most curricula open with a tour of int/float/str/bool
before the learner has any use for one. Here he meets three of the four by accident —
the string in `color("red")`, the decimals from a 1.5 staircase, the `TypeError` from
passing `"100"` to `forward` — and session 4 names things he has already tripped over.

**Session 4 is the weak one and is scheduled as such.** Types are the least visual
material in the tier. It sits between the two strongest sessions on purpose, and the
session plan says explicitly that it is fine to cut it short.

### Compressing to four sessions

The plan says 4–6. If the calendar bites:

- **Merge 1 and 2.** Keep the REPL hook and `s1e1`; move `s1e3` to his own time.
- **Merge 4 into 5.** Types get their real lesson under pressure in session 5 anyway,
  when `input` hands back a `str` and nothing works.
- **Never cut session 3, and never cut session 6.** Session 3 is the tier's actual
  subject and session 6 is the only rehearsal for Boss 2 he gets this early.

---

## Concept coverage

Generated from the `# concepts:` tags in the exercise files, which `verify.py` checks
against the Tier 0 entries of `packages/content/src/concepts.ts`.

| Exercise | Session | DC | Concepts |
|---|---|---|---|
| `s1e1_first_light.py` | 1 | 5 | `print` |
| `s1e2_where_am_i.py` | 1 | 8 | `print` |
| `s1e3_pen_and_colour.py` | 1 | 8 | `print`, `str`, `bool` |
| `s2e1_square_by_name.py` | 2 | 8 | `variables`, `int`, `print` |
| `s2e2_the_staircase.py` | 2 | 10 | `variables`, `int`, `print` |
| `b1_the_typo.py` | 3 | 5 | `reading-errors`, `print` |
| `b2_wrong_kind.py` | 3 | 8 | `reading-errors`, `str`, `int` |
| `b3_never_closed.py` | 3 | 8 | `reading-errors` |
| `b4_out_of_line.py` | 3 | 8 | `reading-errors` |
| `b5_no_such_order.py` | 3 | 10 | `reading-errors` |
| `b6_not_a_number.py` | 3 | 10 | `reading-errors`, `int`, `str` |
| `b7_no_error_at_all.py` | 3 | 12 | `reading-errors`, `variables` |
| `s4e1_type_lab.py` | 4 | 12 | `int`, `float`, `str`, `bool`, `print`, `variables` |
| `s4e2_the_dashed_orbit.py` | 4 | 12 | `float`, `int`, `variables`, `print` |
| `s5e1_ask_and_draw.py` | 5 | 12 | `input`, `str`, `int`, `f-strings`, `variables`, `print` |
| `s5e2_the_nameplate.py` | 5 | 14 | `input`, `f-strings`, `str`, `int`, `variables`, `print` |
| `s6_starter.py` | 6 | 18 | all nine |

All nine Tier 0 concepts are covered. **`bool` is the thinnest, at three exercises, and
that is honest rather than an oversight** — without `if`, a boolean has almost nothing to
do. It appears where it genuinely occurs (`turtle.isdown()`, `50 > 100`) and is not
padded out with make-work. Tier 1 opens with `if` and gives it a job on day one.

**The concepts each file resurfaces are tagged, not just the ones it introduces.** Spec
§3 principle 7 and §5.4 schedule retrieval off these tags, so a file that quietly needs
`variables` should say so even when variables are not its subject. `parent-guide.md` §5
carries hand-run patrol questions until the engine exists.

---

## DC choices

Spec §5.1 derives XP from Difficulty Class, so these are the only numbers here that the
engine will later read. They are set against the D&D scale as it reads for **this
learner in week one**, not against Python difficulty in the abstract.

- **5** — one idea, one line to change. `s1e1`, `b1`.
- **8** — one idea plus a thing that will surprise him.
- **10–12** — two ideas at once, or one idea plus a prediction he will get wrong.
- **14–18** — he has to decide something, not just type something. `s5e2`, `s6`.

Nothing in Tier 0 is above 18. Spec §5.1 renders DC ≥ 20 with a warning, and a warning
label in week one would be teaching him to be afraid of the material rather than of
genuinely hard quests.

---

## Which of these should become quests

Per the brief, this directory does not contain quest YAML and does not touch
`packages/content/`. Recorded here for whoever wires the content pipeline:

**Good `hidden-tests` quests** — deterministic, checkable, no drawing to inspect:

| Exercise | DC | Why it verifies cleanly |
|---|---|---|
| `s2e1_square_by_name.py` task 4 | 8 | Perimeter computed, not typed. Assert on the printed number as the size varies. |
| `s4e1_type_lab.py` | 12 | Every answer is a value. Tests can assert on `type()` results directly. |
| `s5e1_ask_and_draw.py` | 12 | Feed stdin, assert on stdout. The f-string receipt is exactly checkable. |
| `b1`–`b6` as *fix-it* quests | 5–10 | Starter is the broken file; the test is that it runs. The cleanest quest shape in the tier. |

**Good `peer-signoff` quests** — a person has to look:

| Exercise | DC | Why |
|---|---|---|
| Every choice board | 8–12 | Open-ended by design. There is no right picture. |
| `b7_no_error_at_all.py` | 12 | The win condition is that he *says what is wrong*, which no test can check. |
| `s5e2_the_nameplate.py` | 14 | It draws. Someone has to see it. |
| **The Commission** | 18 | Win condition is "it ran on your dad's machine". That is `local-repo` in spirit and peer-signoff in week two. |

**Do not turn into quests:** the session plans, the Chronicle prompts, or the reversal
exercise in session 3. They are parent-delivered and lose their point when automated.

Two notes for whoever builds this:

1. **The turtle-to-canvas shim (spec §8) is a hard prerequisite** for any of these
   becoming in-app quests. Every exercise here draws. Until Pyodide can render turtle,
   these run in a terminal or not at all — which is fine, and is why the tier was
   written to need nothing.
2. **`b1`–`b7` want a verifier that asserts on the traceback**, not just on exit code.
   A quest that accepts any passing run would accept "delete the broken line", which is
   the wrong lesson.

---

## The Chronicle, and a deliberate deviation from the spec

Spec §4 says the Chronicle **begins week 3**. This tier starts it in **week 1**, and the
reason is worth recording rather than hiding.

§5.6 defines the Chronicle as "committed and pushed", and git is Tier 2a, week 6. Read
strictly, the Chronicle cannot start before the thing that carries it. But §5.6 also
says he rereads his Chronicle *from the start of that tier* before every boss fight, and
Boss 1 lands at the end of Tier 1 — so if entries begin at week 3 the first boss fight
has almost nothing to reread, which is the one moment §5.6 says the mechanic earns its
keep.

**Resolution: entries start now as plain markdown in a plain folder. The commit-and-push
half arrives at Tier 2a on schedule.** The six Tier 0 entries then become the first real
commit in his repository, which is a considerably better first commit than an empty
README, and gives the Tier 2a session something of his own to put under version control.

Nothing about §5.6's substance rule changes: ten XP per entry, paid for substance rather
than existence, and empty prompts pay nothing. `parent-guide.md` §6 has the rubric.

---

## Verifying the exercises

```
py -3.14 verify.py
```

Every `.py` file in `exercises/` and `reference/` is run, with the turtle window
suppressed, and checked against its own header tags:

- files tagged `# expect: ok` must exit cleanly **and actually put the pen down**
- files tagged `# expect: NameError` (and so on) must fail with exactly that
- every `# concepts:` tag must be a real Tier 0 concept id

Last run: **19 of 19**, on Python 3.14.6, Windows 11.

It also prints the **line number** each broken sigil actually failed on.
`reference/session-3-answers.md` quotes those tracebacks verbatim, and editing a
docstring silently shifts them — which happened twice while this tier was being written.
Re-run the harness after touching anything in `session-3/` and check the numbers still
match the answer key.

The stroke count is real. An untouched turtle canvas already holds four Tk items — the
cursor is itself a drawing — so counting canvas items would have passed a file that drew
nothing at all. The harness counts pen-down moves instead. That was measured, not
assumed.

**Use `py -3.14` explicitly.** On the parent's machine `python` is 3.12 in PowerShell and
3.14 in Git Bash. The son is on 3.14.

---

## Directory map

```
tier-0/
  README.md              this file
  parent-guide.md        how to run a session; the Socratic ladder; every predicted stall
  verify.py              runs every exercise and checks it against its own tags
  sessions/              one plan per session, in delivery order
  exercises/             the .py files he actually runs
    session-3/error-log.md   the table he fills in while breaking things
    session-6/commission-brief.md
  chronicle/
    TEMPLATE.md          copied once per session
    entry-01-prompt.md   what to say the first time, and how to score it
    entries/             his, empty
  reference/             Datamine payloads (spec 5.5). Parent's copy. Not his.
```
