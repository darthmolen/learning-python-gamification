# Area 2 — The Scribe's Rite, and Escape the Sandbox

**Weeks 6–8. Eight sessions of 45–60 minutes, in two halves that share a boss.**
Spec: `docs/specs/2026-08-26-gamified-python-curriculum-design.md`, §4 Areas 2a and 2b.

**2a:** `repository` · `git-init` · `git-add` · `git-commit` · `git-log` · `git-branch` ·
`git-push`
**2b:** `files-on-disk` · `running-scripts` · `vscode` · `venv` · `pip` · `tracebacks` ·
`main-guard`

**Vehicle: the toolchain itself.** There is no drawing in this area. The thing being built
is the ability to put code somewhere other than this laptop.

**This area is load-bearing.** §2.3 diagnoses the failure every platform surveyed shares —
graduates who "cannot ship an original project, having never left the browser sandbox or
learned where a file goes" — and §3 principle 8 is *leave the sandbox early and
permanently*. Three weeks, fourteen concepts, and it is the seam the whole design was
built to survive.

This area needs git, a terminal, and Python 3.14. **It needs no application and no
Gitea.** A reader with those three things and a USB stick can deliver every session; see
`dm-guide.md` §3 for what to do when the server is not there.

---

## ⚠ Authoring status

**This area is not finished and must not be taught yet.** What exists:

| Part | State |
|---|---|
| `dm-guide.md` | **complete**, covering all eight sessions |
| Sessions 1–4 (2a) and their exercises | **complete** |
| `verify.py` | **complete**, 4 of 4 |
| `vscode-profile/README.md` — install, checklist, full ladder | **complete** |
| `vscode-profile/pyquest-area2.code-profile` | **authored, NOT VERIFIED** |
| Sessions 5–8 (2b) and their exercises | **not written** |
| `reference/` payloads for 2b | **not written** |
| `content/` — five quests and Boss 2 | **complete**, `validate:content` exits 0 |

**Two things gate the rest**, and the first gates the second:

1. **The VS Code profile has not been imported on the son's laptop.** Session 6 is the VS
   Code session, and the entire argument for a stripped profile is that stock defaults are
   what is being rejected. An exported profile is a JSON blob and reading one proves
   nothing. Work the checklist in `vscode-profile/README.md` §4 on that machine.
2. **Sessions 5–8 cannot be finalised against a profile that does not exist**, so they
   wait on (1).

---

## Read in this order

1. **`dm-guide.md`** — the load-bearing document, as in Area 0. Read it before session 1.
   §3 (settle the remote) has to be done before session 4, and §7 (the cold clone) before
   Boss 2.
2. **`vscode-profile/README.md`** — before session 6, and its checklist worked on his
   laptop well before that.
3. **`sessions/session-1-what-a-repository-is.md`** — then one per session, on the night.
4. **`exercises/README.md`** — how the walkthroughs and the four Python files fit together.

---

## The sessions

| # | Half | Title | Introduces | Resurfaces | Files |
|---|---|---|---|---|---|
| 1 | 2a | **What A Repository Is** | `repository`, `git-init` | — | `w1`, `still_works.py` |
| 2 | 2a | **The First Commit** | `git-add`, `git-commit` | `repository` | `w2`, `motto.py`, `gitignore.txt` |
| 3 | 2a | **The Log As A Story** | `git-log`, `git-branch` | `git-commit` | `w3`, `streak.py` |
| 4 | 2a | **Push, And It Is Somewhere Else** | `git-push` | `git-log`, `git-commit`, `repository` | `w4`, `receipt.py` |
| 5 | 2b | Where A File Actually Goes | `files-on-disk`, `running-scripts` | `print`, `git-add` | *not written* |
| 6 | 2b | A Real Editor | `vscode` | `files-on-disk`, `running-scripts` | *not written* |
| 7 | 2b | Its Own Python | `venv`, `pip` | `running-scripts` | *not written* |
| 8 | 2b | Read The Stack | `tracebacks`, `main-guard` | `reading-errors`, `venv` | *not written* |

**The 2a/2b boundary sits between 4 and 5, and it is a real one.** Session 4 ends with his
code on another machine; session 5 starts with the question of where a file lives. But it
is **not a directory boundary** — one area, one `sessions/`, one `exercises/`, one
`verify.py`, one DM guide. `concepts.ts` says the two halves share an area number and a
boss, and `AREAS` is a flat `0..7`; the a/b split is prose in spec §4 and nothing more.

**Sessions 1–4 need no Python at all**, which is why 2a survives Gitea being down.

### Why this order

**Git comes before the toolchain, not after.** The obvious ordering is the other way —
teach him to run files properly, then teach him to save them. It is wrong here for one
reason: §5.6 says the Journal *becomes* committed and pushed, and the Journal is already
five weeks old by week six. Session 2a-2 is where sixteen entries of his own writing
become the first commit in his repository, and that beat gets weaker every week it is
delayed. Files on disk can wait a fortnight. A habit that is quietly failing to become
what the spec says it is cannot.

**Session 2 plants a trap and session 3 springs it.** He writes bad commit messages,
unimproved, on purpose, and four days later cannot read his own log. That bill arriving in
his own handwriting is worth more than any rule about commit messages given in advance.
The dm guide says explicitly not to intervene.

**Session 4 is the weakest-looking and is scheduled as the strongest.** A successful push
prints four boring lines. Its real beat is step 5 of the walkthrough — cloning his own
repository into an empty folder and running a file out of it — and that step is also the
rehearsal for Boss 2. It is the one step in the area that must not be cut for time.

**Session 6 could be first and is sixth.** Installing VS Code in session 1 would cost an
evening for nothing: sessions 1–4 have no Python to edit. Area 0's guide already says
Notepad is sufficient and that VS Code is Area 2b vocabulary.

### Compressing to six sessions

If the calendar bites:

- **Merge 1 and 2.** `git init` and the first commit are one evening if he is quick, and
  session 1's `.git` spelunk moves to the choice board.
- **Merge 6 into 5.** Import the profile at the end of the files-on-disk session and let
  VS Code be the tool he uses in session 7 rather than a session of its own.
- **Never cut session 4 and never cut session 8.** Session 4 is the only rehearsal for
  Boss 2, and session 8 is the traceback lesson the boss will demand.

---

## `tracebacks`, the third pass

Worth stating because it is the clearest example of §3 principle 7 in the campaign.

- **Area 0, session 3:** `reading-errors`, in the REPL and in tiny files. One or two frames.
- **Area 1, session 6:** the same skill against loop errors.
- **Area 2b, session 8:** `tracebacks`, and it is a genuinely different object.

The traceback changes shape once the code is in a file with a name and a line number and
an import — and **this is the first time a stack has more than one frame that matters.**
Session 8 tags a new concept id rather than resurfacing the old one because what he is
reading is not the same thing he learned to read in week two.

---

## DC choices

Spec §5.1 derives XP from Difficulty Class. **Area 2's spread is wider than either area
before it — 5 to 22 — and that is a decision rather than a smear.**

- **5–8 for the git quests.** Individually, git commands are the easiest material in the
  campaign. `git add` is one word and there is nothing to reason about. A DC above 8 for
  any single 2a command would be dishonest.
- **10–12 for the 2b quests.** Two ideas at once, and the second one is invisible: which
  Python is running is not a thing he can see.
- **22 for Boss 2**, and it is the campaign's first item over 20.

§5.1 renders DC ≥ 20 with a warning, and **here the warning is correct and wanted.**
Boss 2 is the hardest thing he will have done, harder than Boss 1, because it is the first
task whose failure mode is invisible from where he is standing: it works on his machine
and that tells him nothing. Area 1 avoided the band deliberately, to keep a week-three
learner from being taught fear. By week eight an honest warning is information rather than
intimidation.

---

## Concept coverage

Area 2's fourteen concepts, and where each one is actually taught.

| Concept | Half | Session | Walkthrough / file | Shipped? |
|---|---|---|---|---|
| `repository` | 2a | 1 | `w1_the_folder_that_remembers.md` | yes |
| `git-init` | 2a | 1 | `w1_the_folder_that_remembers.md` | yes |
| `git-add` | 2a | 2 | `w2_the_first_commit.md` | yes |
| `git-commit` | 2a | 2, 3 | `w2`, `w3` | yes |
| `git-log` | 2a | 3 | `w3_the_log_as_a_story.md` | yes |
| `git-branch` | 2a | 3 | `w3_the_log_as_a_story.md` | yes |
| `git-push` | 2a | 4 | `w4_push_and_prove_it.md` | yes |
| `files-on-disk` | 2b | 5 | — | **not yet** |
| `running-scripts` | 2b | 5, 7 | — | **not yet** |
| `vscode` | 2b | 6 | `vscode-profile/` (unverified) | **not yet** |
| `venv` | 2b | 7 | — | **not yet** |
| `pip` | 2b | 7 | — | **not yet** |
| `tracebacks` | 2b | 8 | — | **not yet** |
| `main-guard` | 2b | 8 | — | **not yet** |

**Seven of fourteen taught.** All fourteen are tagged by the `content/` items, which are
complete — a quest can be authored before the session that rehearses it, and Boss 2 tags
all fourteen because it is the whole area at once.

### What the Python files carry

The four runnable exercises tag Area 0 and Area 1 vocabulary, not Area 2's. That is
correct and worth saying: **`git-add` is not a thing a Python file can demonstrate.** The
files exist to be committed, branched, pushed and cloned; the git concepts live in the
walkthroughs beside them.

| Exercise | Session | DC | Concepts |
|---|---|---|---|
| `still_works.py` | 1 | 5 | `print`, `variables`, `f-strings` |
| `motto.py` | 2 | 5 | `print`, `variables`, `str`, `f-strings` |
| `streak.py` | 3 | 8 | `for`, `range`, `accumulator-pattern`, `variables`, `int`, `print`, `f-strings` |
| `receipt.py` | 4 | 8 | `input`, `str`, `variables`, `print`, `f-strings` |

`receipt.py`'s YOUR MOVE step 2 is a deliberate Area 0 callback: `input` hands back a
`str`, which cost him a `TypeError` in week two, and he is asked to **prove** it rather
than remember it.

---

## Verifying the exercises

```
py -3.14 verify.py
```

Last run: **4 of 4**, on Python 3.14, Windows 11. `ruff check curriculum/area-2/` passes.

**Read the second number the harness prints as well as the first.** It covers the runnable
`.py` exercises only, and four is small against Area 0's nineteen. That is honest rather
than thin: there is nothing to execute in "make a commit, then read the log". The harness
says out loud how many walkthroughs it is *not* covering, because a harness that silently
counted zero and printed a reassuring `0 of 0` would be worse than useless.

It checks each file against its own header tags: every `# concepts:` id must be real
vocabulary from areas 0–2, `# dc:` must be a whole number on the 5–30 scale, and
`# expect: ok` must exit cleanly **and print something**. All six of those checks have
been seen to fail against seeded mutants — a misspelled tag, an Area 3 tag at area 2, a DC
of 99, a missing `# stdin:`, an error claimed that never happens, and a file that runs and
prints nothing.

### The walkthrough completion checklist

The four git walkthroughs are the other half of this area's verification, and they are
audited by a person following them. Each ends in its own **Done when** list; this is the
one-line-per-walkthrough summary.

| Walkthrough | Followed end to end, against a real repository | By | Date |
|---|---|---|---|
| `w1_the_folder_that_remembers.md` | ☐ | | |
| `w2_the_first_commit.md` | ☐ | | |
| `w3_the_log_as_a_story.md` | ☐ | | |
| `w4_push_and_prove_it.md` | ☐ | | |

**Unticked, deliberately.** They were authored against the commands they teach, and
authoring is not following. Whoever first runs session 1 ticks the first line.

---

## The Journal, and where it goes

Area 0 started the Journal in week 1 rather than week 3, recorded the deviation openly,
and said the git half would arrive here. **It does, in session 2**, and it is that
session's hook rather than a footnote at the end of it.

His entries are **copied** into a `journal/` directory in *his* repository and become its
first commit. Nothing in this repository moves, and there is no `journal/` directory in
`curriculum/area-2/` — the template and the first-entry script are Area 0's and are still
the only copies. That is a deliberate departure from the per-area layout: duplicating
`TEMPLATE.md` into every area directory would produce eight copies of one file that must
never disagree.

The scoring is unchanged — ten XP an entry, paid for substance rather than existence
(§5.6) — with two additions in `dm-guide.md` §6: the session-4 entry names the remote, and
the Boss 2 entry records the cold clone, pass or fail, with the machine named.

From here the dm's replies become comments in Gitea when Gitea exists, and turn into code
review culture. Until then they stay as a line under the entry, exactly as in Area 0.

---

## Which of these became quests

Unlike Area 0, this area's `content/` items exist. Five quests plus Boss 2, per §5.2, and
**the verifier column is the interesting one** — Area 2 is where the verifier story turns
over mid-area.

| id | Title | Session | Verifier | DC |
|---|---|---|---|---|
| `a2-the-first-commit` | The First Commit | 2 | `git-signal: commit` | 5 |
| `a2-the-log-as-a-story` | The Log As A Story | 3 | `peer-signoff: dm` | 8 |
| `a2-it-is-somewhere-else` | It Is Somewhere Else | 4 | `git-signal: push` | 8 |
| `a2-where-the-file-lives` | Where The File Lives | 5 | `local-repo` | 10 |
| `a2-its-own-python` | Its Own Python | 7 | `local-repo` | 12 |
| `a2-escape-the-sandbox` | **Boss 2 — Escape the Sandbox** | 8 | `peer-signoff: dm` | **22** |

Four notes for whoever reads this later:

1. **No starters, and only two test files.** `scaffold.ts` writes a starter only for
   `hidden-tests`, which §6.3 confines to Areas 0–1, so Area 2 ships none at all. It writes
   a test file for `hidden-tests` and `local-repo` only, and just two items here are
   `local-repo`. An author who scaffolds six quests and finds two test stubs has not lost
   four; a `git-signal` quest that grew a hidden test would be checking the wrong thing
   entirely.
2. **`a2-the-log-as-a-story` is deliberately not a `git-signal`.** A signal can prove
   commits exist; it cannot prove the log reads as a *story*, which is the whole concept.
3. **Boss 2 is `peer-signoff: dm`, not `local-repo`.** `VerifierSchema` is a discriminated
   union on `type` — one verifier per item, never two. `local-repo` proves tests pass. The
   cold clone does not care whether tests pass: a person clones into a directory that has
   never seen his code, builds a venv, types the command from his README, and judges
   whether it ran. §5.3's *it must run from a clean clone on the other person's machine* is
   a human judgement or it is nothing. **`dm-guide.md` §7 is the sign-off checklist**, not
   documentation beside one.
4. **The two `git-signal` quests are inert until Lane A Phase 1.5.** That is fine and
   planned: the teaching and the applause are separated. He still pushes; he just does not
   get the confetti. `planning/backlog/feature_gitea-lan-access-for-the-son_2026-08-27.md`
   is the blocker for the applause half and belongs to whoever owns `infra/`.

---

## Directory map

```
area-2/
  README.md              this file
  dm-guide.md            how to run a session; the remote decision; the cold clone
  verify.py              runs the runnable exercises; says what it does not cover
  sessions/              one plan per session, in delivery order (1-4 written)
  exercises/
    session-1/  w1_the_folder_that_remembers.md, still_works.py
    session-2/  w2_the_first_commit.md, motto.py, gitignore.txt
    session-3/  w3_the_log_as_a_story.md, streak.py
    session-4/  w4_push_and_prove_it.md, receipt.py
  reference/             Datamine payloads. Near-empty for 2a, and it says why
  vscode-profile/
    pyquest-area2.code-profile   the strip. NOT YET VERIFIED
    README.md                    install, the son's laptop checklist, the full ladder
```

No `journal/`. See **The Journal, and where it goes** above.
