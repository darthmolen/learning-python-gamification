# Area 2 — The Scribe's Rite, and Escape the Sandbox

**Weeks 6–8. Eight sessions of 45–60 minutes, in two halves that share a boss.**
Spec: `docs/specs/2026-08-26-gamified-python-curriculum-design.md`, §4 Areas 2a and 2b.

**2a:** `repository` · `git-init` · `git-add` · `git-commit` · `git-log` · `git-branch` ·
`git-push`
**2b:** `files-on-disk` · `running-scripts` · `vscode` · `venv` · `pip` · `tracebacks` ·
`main-guard`

**Vehicle: the toolchain itself.** There is no drawing in this area. The thing being built
is the ability to put code somewhere other than the machine it was written on.

**This area is load-bearing.** §2.3 diagnoses the failure every platform surveyed shares —
graduates who "cannot ship an original project, having never left the browser sandbox or
learned where a file goes" — and §3 principle 8 is *leave the sandbox early and
permanently*. Three weeks, fourteen concepts, and it is the seam the whole design was
built to survive.

This area needs git, a terminal, and Python 3.14. **It needs no application and no
Gitea.** A reader with those three things and a USB stick can deliver every session; see
`dm-guide.md` §3 for what to do when the server is not there.

---

## Authoring status

**Authored in full. One thing outstanding, and it holds delivery of session 6 rather than
the area.**

| Part | State |
|---|---|
| `dm-guide.md` | **complete**, covering all eight sessions |
| Sessions 1–4 (2a) and their exercises | **complete** |
| Sessions 5–8 (2b) and their exercises | **complete** |
| `reference/` payloads for 2b | **complete** — the worked venv project and the traceback answer key |
| `verify.py` | **complete**, 13 of 13 |
| `tools/vscode/README.md` — install, checklist, full ladder | **complete** |
| `tools/vscode/pyquest-area2.code-profile` | **imported and confirmed; the re-export is outstanding** |
| `content/` — five quests and Boss 2 | **complete**, `validate:content` exits 0 |

**What is outstanding.** The profile imported on the target machine on 2026-08-31 and the
strip holds — *"much simpler"*, from the person who has to look at it. What has not
happened is §4 of `tools/vscode/README.md` worked line by line, and the **re-export**:
five of the hidden views are view visibility rather than settings, they live in the
profile's `globalState`, and only an export from a configured running editor captures
them. Until that lands, the file in `tools/vscode/` is still the hand-authored one and the
next machine gets the same partial strip.

It is carried as `planning/reminders/follow-up_re-export-the-vscode-profile_2026-09-01.md`.

**It does not block session 6, and session 6 says what to do about it.** Hide the five by
hand and run the session. What the session cannot survive is stock VS Code with every
panel showing, which is the thing the profile exists to reject.

**Authoring order and delivery order are different things**, and this area was written
that way on purpose: sessions are authored against the design, and they are taught against
a machine.

---

## Read in this order

1. **`dm-guide.md`** — the load-bearing document, as in Area 0. Read it before session 1.
   §3 (settle the remote) has to be done before session 4, and §7 (the cold clone) before
   Boss 2.
2. **`tools/vscode/README.md`** — before session 6, and its checklist worked on his
   laptop well before that.
3. **`sessions/session-1-what-a-repository-is.md`** — then one per session, on the night.
4. **`exercises/README.md`** — how the walkthroughs and the Python files fit together.
5. **`reference/session-8-answers.md`** — before session 8, and never in front of him. It
   is the traceback answer key, and it exists so that you can stay quiet.

---

## The sessions

| # | Half | Title | Introduces | Resurfaces | Files |
|---|---|---|---|---|---|
| 1 | 2a | **What A Repository Is** | `repository`, `git-init` | — | `w1`, `still_works.py` |
| 2 | 2a | **The First Commit** | `git-add`, `git-commit` | `repository` | `w2`, `motto.py`, `gitignore.txt` |
| 3 | 2a | **The Log As A Story** | `git-log`, `git-branch` | `git-commit` | `w3`, `streak.py` |
| 4 | 2a | **Push, And It Is Somewhere Else** | `git-push` | `git-log`, `git-commit`, `repository` | `w4`, `receipt.py` |
| 5 | 2b | **Where A File Actually Goes** | `files-on-disk`, `running-scripts` | `print`, `git-add` | `w5`, `where_am_i.py` |
| 6 | 2b | **A Real Editor** | `vscode` | `files-on-disk`, `running-scripts` | `w6`, `the_dot_on_the_tab.py` |
| 7 | 2b | **Its Own Python** | `venv`, `pip` | `running-scripts` | `w7`, `which_python.py` |
| 8 | 2b | **Read The Stack** | `tracebacks`, `main-guard` | `reading-errors`, `venv` | `w8`, six `.py` |

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

**Session 6 is also the one session with no quest, and that is a decision.** Five quests
plus a boss is the shape of an area (§5.2), and `vscode` is tagged by Boss 2, which tags
all fourteen concepts. Inventing an assessment for "he opened a folder" would be a quest
built to fill a row in a table. The editor is a tool he uses for six more areas; the
proof that he can use it is every session after this one.

**Session 8 is the boss rehearsal, and both halves of it are in the boss.** A traceback is
what he will be reading when the cold clone fails on the dm's machine, and
`if __name__ == "__main__"` is item 3 on the boss brief by name. That is why `main-guard`
is taught one session before it pays rather than in Area 4 where importing becomes
routine.

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
task whose failure mode is invisible from where he is standing: it works on the learner's machine
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
| `files-on-disk` | 2b | 5 | `w5_where_the_file_actually_goes.md`, `where_am_i.py` | yes |
| `running-scripts` | 2b | 5, 7 | `w5`, `w7`, `where_am_i.py` | yes |
| `vscode` | 2b | 6 | `w6_a_real_editor.md`, `tools/vscode/` | yes |
| `venv` | 2b | 7 | `w7_its_own_python.md`, `which_python.py` | yes |
| `pip` | 2b | 7 | `w7_its_own_python.md` | yes |
| `tracebacks` | 2b | 8 | `w8_read_the_stack.md`, the four failing files | yes |
| `main-guard` | 2b | 8 | `banner.py`, `show_the_banner.py` | yes |

**Fourteen of fourteen taught.** All fourteen are also tagged by the `content/` items, and
Boss 2 tags all of them at once because it is the whole area in one fight.

### What the Python files carry, and why the two halves differ

**2a's four runnable exercises tag Area 0 and Area 1 vocabulary, not Area 2's.** That is
correct and worth saying: **`git-add` is not a thing a Python file can demonstrate.** Those
files exist to be committed, branched, pushed and cloned; the git concepts live in the
walkthroughs beside them.

**2b's nine tag Area 2 vocabulary, and that is correct too.** `files-on-disk`,
`running-scripts`, `venv`, `tracebacks` and `main-guard` are all things a Python file can
do in front of you: print where it is, name the interpreter running it, import another file
and produce a stack with three frames in it. The half of the area that a program can
demonstrate is exactly the half a program demonstrates.

| Exercise | Session | DC | Concepts |
|---|---|---|---|
| `still_works.py` | 1 | 5 | `print`, `variables`, `f-strings` |
| `motto.py` | 2 | 5 | `print`, `variables`, `str`, `f-strings` |
| `streak.py` | 3 | 8 | `for`, `range`, `accumulator-pattern`, `variables`, `int`, `print`, `f-strings` |
| `receipt.py` | 4 | 8 | `input`, `str`, `variables`, `print`, `f-strings` |
| `where_am_i.py` | 5 | 10 | `files-on-disk`, `running-scripts`, `print`, `f-strings` |
| `the_dot_on_the_tab.py` | 6 | 10 | `vscode`, `running-scripts`, `variables`, `print`, `f-strings` |
| `which_python.py` | 7 | 12 | `venv`, `running-scripts`, `if`, `else`, `print`, `f-strings` |
| `bottom_frame.py` | 8 | 10 | `tracebacks`, `reading-errors`, `int`, `str`, `variables`, `print` |
| `middle_frame.py` | 8 | 10 | `tracebacks`, `reading-errors`, `print`, `f-strings` |
| `top_frame.py` | 8 | 12 | `tracebacks`, `reading-errors`, `print`, `f-strings` |
| `the_library_floor.py` | 8 | 12 | `tracebacks`, `reading-errors`, `str`, `print` |
| `banner.py` | 8 | 12 | `main-guard`, `running-scripts`, `variables`, `str`, `print`, `f-strings` |
| `show_the_banner.py` | 8 | 12 | `main-guard`, `running-scripts`, `str`, `print`, `f-strings` |

`receipt.py`'s YOUR MOVE step 2 is a deliberate Area 0 callback: `input` hands back a
`str`, which cost him a `TypeError` in week two, and he is asked to **prove** it rather
than remember it.

**Session 8's chain is three files for one mistake.** `top_frame` imports `middle_frame`
imports `bottom_frame`, and only the last of them is wrong. Run them in that order and the
same error arrives at one frame, then two, then three, with an identical last line every
time — **the error never moves, only the distance to it does.** `the_library_floor.py` is
the other shape: four frames, of which he wrote one, which is the one that makes people
give up.

---

## Verifying the exercises

```
py -3.14 verify.py
```

Last run: **13 of 13**, on Python 3.14.6, Windows 11. `ruff check curriculum/area-2/`
passes.

**Read all three numbers the harness prints, not just the first.** It covers the runnable
`.py` exercises only — thirteen — and it then says what it is not running:

- **one file it cannot run.** `reference/its-own-python/main.py` is the worked answer to
  the venv quest, and a project that would run without its dependencies installed is not
  an answer to that quest. The rule states itself rather than naming an exception: **a file
  under a directory holding a `requirements.txt` has an environment of its own, and this
  harness does not have it.** Delete that `requirements.txt` and the harness runs it and
  fails with `ModuleNotFoundError`, which is how the rule was proved.
- **eight walkthroughs it has nothing to execute in.** There is no code in "make a commit,
  then read the log".

A harness that silently counted zero and printed a reassuring `0 of 0` would be worse than
useless, which is why this one prints what it declined to do.

It checks each file against its own header tags: every `# concepts:` id must be real
vocabulary from areas 0–2, `# dc:` must be a whole number on the 5–30 scale, and
`# expect: ok` must exit cleanly **and print something**. All six of those checks have
been seen to fail against seeded mutants — a misspelled tag, an Area 3 tag at area 2, a DC
of 99, a missing `# stdin:`, an error claimed that never happens, and a file that runs and
prints nothing.

### The walkthrough completion checklist

The eight walkthroughs are the other half of this area's verification, and they are
audited by a person following them. Each ends in its own **Done when** list; this is the
one-line-per-walkthrough summary.

| Walkthrough | Followed end to end, against a real repository | By | Date |
|---|---|---|---|
| `w1_the_folder_that_remembers.md` | ☐ | | |
| `w2_the_first_commit.md` | ☐ | | |
| `w3_the_log_as_a_story.md` | ☐ | | |
| `w4_push_and_prove_it.md` | ☐ | | |
| `w5_where_the_file_actually_goes.md` | ☐ | | |
| `w6_a_real_editor.md` | ☐ | | |
| `w7_its_own_python.md` | ☐ | | |
| `w8_read_the_stack.md` | ☐ | | |

**Unticked, deliberately.** They were authored against the commands they teach, and
authoring is not following. Whoever first runs session 1 ticks the first line.

---

## The Journal, and where it goes

Area 0 started the Journal in week 1 rather than week 3, recorded the deviation openly,
and said the git half would arrive here. **It does, in session 2**, and it is that
session's hook rather than a footnote at the end of it.

His `journal.md` **moves** into *his* repository and becomes its first commit — one file,
one `git add`, and the six entries already in it come along as history he can read. Nothing
in this repository moves, and there is no `journal/` directory in `curriculum/area-2/` — the
template and the first-entry script are Area 0's and are still the only copies. That is a deliberate departure from the per-area layout: duplicating
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
  sessions/              one plan per session, in delivery order (all eight)
  exercises/
    session-1/  w1_the_folder_that_remembers.md, still_works.py
    session-2/  w2_the_first_commit.md, motto.py, gitignore.txt
    session-3/  w3_the_log_as_a_story.md, streak.py
    session-4/  w4_push_and_prove_it.md, receipt.py
    session-5/  w5_where_the_file_actually_goes.md, where_am_i.py
    session-6/  w6_a_real_editor.md, the_dot_on_the_tab.py
    session-7/  w7_its_own_python.md, which_python.py
    session-8/  w8_read_the_stack.md, and six .py -- the three-file chain,
                the library floor, and the main-guard pair
  reference/             Datamine payloads. Nothing for 2a, and it says why
    its-own-python/  the worked venv project: main.py, requirements.txt, README.md
    session-8-answers.md   every traceback in session 8, captured verbatim
```

No `journal/`. See **The Journal, and where it goes** above.

No `vscode-profile/` either — the profile and its ladder live at `tools/vscode/`,
with every other thing a machine needs installed on it. Session 6 points there.
