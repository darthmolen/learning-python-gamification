# Session 7 — Its Own Python

**Concepts:** `venv` · `pip` · resurfaces `running-scripts`
**Files:** `sessions/session-7/`
**Journal:** the entry names the three Pythons and where each one lives

**This is the session with a real trap in it, and the trap is on this machine rather than
in a textbook.** `tools/python/README.md` records it: `python` resolves to 3.12 in
PowerShell and 3.14 in Git Bash, on one of the machines this campaign runs on. Two
shells, two answers, neither wrong. Every "I installed it and it says it is not there" he
will ever have is that fact wearing a different hat.

**He needs internet for one `pip install`.** Check it before the session; a session that
opens with a failing download is a session that opens with a progress bar.

**The reward for this session is not obvious and it is worth stating.** He is not getting
a feature. He is getting the ability to hand a project to somebody else — which is next
session's boss, and it does not work without tonight.

---

## Beat 1 — Invasion (3 minutes)

1. What did the editor take away that a normal VS Code has?
2. What is the dot on the tab?
3. How do you open a terminal in the folder you are editing?

---

## Beat 2 — The hook (8 minutes)

**Do not open with the word "environment".** Open with the argument, because he has
already had it with a computer and will recognize it instantly.

> "Suppose you installed something on your laptop months ago and forgot. Then you send me
> your program and it does not work on mine. We are running exactly the same code. What
> is different?"

Let him get there. He will, because the shape is familiar — it is mods, and a modpack
that works for one person and not another.

Then the second question, which is the one this session answers:

> "How many Pythons do you think are on this laptop?"

He will say one. It is not one. Beat 3 step 1 shows him two in about ninety seconds, and
step 4 makes a third.

**Do not explain how a venv works.** Not `PATH`, not shims, not site-packages. He needs
one true sentence — *a Python that belongs to this folder* — and four commands.

---

## Beat 3 — The work (30 minutes)

### `sessions/session-7/w7_its_own_python.md`

- **Step 1 — the two answers.** `py -3.14 which_python.py`, then `python
  which_python.py`. On this machine those can print different paths and different
  versions, from the same folder, in the same second. **If both answer the same on his
  machine, say so and do not fake it** — say that the trap is real on the DM's machine and
  that the habit is what protects him when it is not his machine.
- **Step 2 — build it**, and then `ls .venv/Scripts`. Thousands of files, none of which he
  wrote, all of which come back from one command. That count is what makes step 8 and
  `.gitignore` obvious rather than a rule.
- **Step 3 — activate**, and the prompt changes. That `(.venv)` is the only thing on the
  screen that says which Python he is talking to. Point at it.
- **Step 4 — the same question, a third answer**, and then the part that catches adults:
  **`py -3.14` inside an activated environment is NOT the environment.** It asks for a
  *version*, and an environment is not a version. So the rule that has kept him safe for
  six weeks inverts here, in exactly one place, and he should be told plainly rather than
  left to discover it during a boss fight.

  Measured on this machine, activated, in the same terminal:

  ```
  python     →  ...\.venv\Scripts\python.exe        the environment
  py         →  ...\.venv\Scripts\python.exe        the environment
  py -3.14   →  ...\pythoncore-3.14-64\python.exe   NOT the environment
  ```

  The one line worth memorising is in the walkthrough:
  `python -c "import sys; print(sys.executable)"`.

- **Step 5 — install something that does something visible.** `pyfiglet` draws foot-high
  letters and is the reference answer; anything offline and obvious is fine. **A
  dependency whose value is invisible teaches that dependencies are paperwork.**
- **Step 6 is the proof, and it is a deliberate failure.** `deactivate`, run it again,
  `ModuleNotFoundError`. Nothing was uninstalled. He is asking a different Python and that
  Python has never heard of it. **This is the session in one error message** — let it
  happen, and let him say what it means before you do.
- **Step 7 — `requirements.txt`, hand-written, one line.** Show him `pip freeze` output
  and then do not use it: pinning is real and it is Area 6 vocabulary (`dependencies`).
  Then `git status`, and the payout — `.venv` is not in the list, because in session 2 he
  copied in a `.gitignore` with a line about something he had not met yet. **Say that out
  loud.** Three weeks is a long time for a promise to be kept.
- **Step 8 — write the README, then delete `.venv` and rebuild it from the README**,
  typing only what is written there. This is the rehearsal for Boss 2 and it is the most
  valuable four minutes in the session. If he has to remember one thing that is not
  written down, the README is not finished — and that is precisely how the boss fails, one
  session from now, on a machine where remembering is not available to him.

### The quest

`a2-its-own-python`, DC 12, `local-repo`. §6.6 runs submissions with `--network none`, so
the test **cannot** prove his environment works — it checks that he declared it and did
not commit it: `requirements.txt` parses, `main.py` imports something, no `.venv` in the
repository, `.gitignore` keeps it out, and the README says how. The brief says so openly.

**The half a machine cannot check is yours.** Watch him activate it and watch the prompt
change. That is not decoration; it is the observable half of the concept.

---

## Beat 4 — Choice board (in the work time)

- **The Second Environment** — build a venv for a *different* folder, install something
  else in it, and prove the two cannot see each other.
- **The Rebuild** — delete `.venv` and rebuild it from the README, timed. Under a minute
  is the target, and the second run is always the fast one.
- **The Interrogation** — find three more things `sys` will tell him about the Python that
  is running. `sys.path` is the interesting one and he does not need to understand it.
- **The Wrong One On Purpose** — deactivate, `pip install` something, and work out where
  it went and who can see it.
- **Something else** — anything, as long as he says what he expects first.

---

## Beat 5 — Journal (5 minutes)

Same four prompts, plus one addition worth insisting on: **the entry names the three
Pythons and where each one lives.** He will need exactly that list the first time
something is missing on a machine that is not his, and by then he will not remember
tonight.

---

## Where he will stall

See `dm-guide.md` §4. The predicted five, and the first one is the defining stall of 2b:

1. **Forgot to activate.** "Which Python is running right now? Not which one you meant —
   which one *is*."
2. **`pip install` into the wrong interpreter.** The trap this machine really has. "One of
   you is talking about a different Python. Which one, and how do you check?"
3. **Deleted `.venv` and panicked.** Nothing is lost, and it is the one directory in his
   life that is genuinely disposable. Ask what is in there that *he* wrote.
4. **Committed `.venv`.** Very common, and the reason `.gitignore` exists. Ask how many
   files that was and whether he wrote any of them.
5. **"Why not just install it normally?"** The best question of 2b. Answer it with the
   other question: what happens when a second project wants a different version, and
   where would that fight happen?

## What you may not say

When he cannot work out why the import fails: **do not type the activate command.** Ask
what his prompt says. The answer is on his screen.

When he asks what is inside `.venv`: "go and look" — and then let the answer be
"thousands of files I did not write", which is the whole justification for `.gitignore`
in one observation.

When the rebuild in step 8 fails because his README is incomplete: **do not fill in the
missing command.** That failure tonight costs four minutes. The same failure next session
costs him the boss.
