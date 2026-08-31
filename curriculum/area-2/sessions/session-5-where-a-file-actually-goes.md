# Session 5 — Where A File Actually Goes

**Concepts:** `files-on-disk` · `running-scripts` · resurfaces `print`, `git-add`
**Files:** `sessions/session-5/`
**Journal:** the first entry of the second half — what a program turned out to be

**This is the first session of 2b and it changes what an evening looks like.** Sessions
1–4 were git at a terminal. From here everything is a file, in a folder, run by a command
he typed. Say that out loud at the start: the half that moves code between machines is
done, and the half that puts it on one properly starts tonight.

**The material is easy and the idea is not.** Nothing in this session is difficult to
type. What is difficult is that *where you are standing* is now a thing that exists and
can be wrong, and he has never had to think about it because something has always chosen
for him — the browser, the REPL, the Quest screen.

§2.3 is the reason this session exists at all: graduates who "cannot ship an original
project, having never left the browser sandbox or **learned where a file goes**." This
one, and not the boss, is where that sentence gets fixed.

---

## Beat 1 — Invasion (3 minutes)

1. What does `push` send — files, or something else?
2. Where does it send them?
3. What happens if you push without committing first?

Then read back last session's forecast.

---

## Beat 2 — The hook (10 minutes)

**Give him the problem before the tool, and do it with the file explorer closed.**

Ask him to tell you, out loud, where the program he wrote last week is *right now*. Not
to open it. Just to say where it is.

He will say something like "in my folder". Push once:

> "Which folder? Say the whole thing, starting at the drive letter."

Almost nobody can. That is not ignorance, it is that nothing has ever required it of
him.

Then the second question, and it is the one the session turns on:

> "When you run a program, does the computer look for it where the file is, or where
> *you* are?"

Let him guess. Do not tell him. He is about to find out in beat 3 by making it fail, and
a guess he has committed to out loud is worth ten minutes of explanation.

**Do not teach paths as a topic.** No absolute versus relative, no `.` and `..` lecture.
He needs `pwd`, `ls`, `cd` and one failure tonight; the vocabulary can arrive later
attached to something that hurt.

---

## Beat 3 — The work (30 minutes)

### `sessions/session-5/w5_where_the_file_actually_goes.md`

Steps 1 and 2 are quick — `pwd`, `ls`, and thirty seconds in the REPL to watch it forget
everything the moment it closes. That REPL demonstration is worth doing even though he
will say he already knew: **it is the sentence "a REPL is a conversation, a file is a
thing"** and it is the last time this campaign opens a REPL as the main event.

- **Steps 4 and 5 — the same file, two places to stand.** He runs `where_am_i.py` from
  its own directory, then from one above with a path in front of it. Two lines print;
  **one changes and one does not.** Make him say which before he looks. This is the
  entire concept and it costs one command.
- **Step 6 is the important failure.** Same command, wrong directory, no path. Let it
  fail. Make him read the whole error including the path it printed, and then ask the
  question that will serve him for a decade:

  > "Which of you is in the wrong place — you, or the file?"

- **Step 7 — double-click it.** A black window appears and vanishes before he can read
  it. Do not fix it, and do not let him spend ten minutes trying to. The point is the
  comparison: the terminal is not a harder way to run a file, it is how you get to read
  what the file said.

### Step 8 is the quest

`a2-where-the-file-lives`, DC 10, and the first `local-repo` verifier in the campaign —
which means **the API pulls his repository and runs a specification against it.** He
cannot pass it by pasting into a box. That is §3 principle 8 becoming mechanical rather
than aspirational.

Two lines of `print` pass, deliberately. If he starts building something clever, stop
him: tonight's subject is not the program.

**The one thing to protect:** the brief asks him to prove the same command fails one
directory up, and the test asserts it. He may want to "fix" that by dropping a second
copy of `run_me.py` in the repository root. Do not let him — and do not just forbid it,
ask what that would prove.

### Step 9 — commit it

`git add`, resurfaced on purpose. Worth naming out loud: **this is the first thing he has
committed that he wrote from nothing.** The journal was already written and the earlier
files were copied in.

---

## Beat 4 — Choice board (in the work time)

- **The Hunt** — find three `.py` files anywhere on the machine, using only the terminal,
  and print the full path of each.
- **The Deep Folder** — make a directory four levels down, put a file at the bottom, and
  run it from the top without moving.
- **The Two Copies** — put the same file in two folders, change one, and run both. Which
  one did he change? How would he tell without opening them?
- **Something else** — anything, as long as he says what he expects first.

---

## Beat 5 — Journal (5 minutes)

Same four prompts. Tonight's is the first entry of the second half, and it is worth
asking him to answer one extra question in it:

> "What did you think a program was, last week?"

He will have an answer and it will be wrong in an interesting way. That entry is worth
reading back at Boss 2.

---

## Where he will stall

See `dm-guide.md` §4. The predicted five:

1. **File not found**, because he is not in the directory the file is in. The question is
   about location, never the fix.
2. **Edits one copy and runs another.** Ask how many copies exist and how he could prove
   it.
3. **Types a whole script into the REPL** out of six weeks of habit. Ask which prompt he
   is at and what happens to it when the window closes.
4. **Uses `python` instead of `py -3.14`.** Note it, ask what could tell him which one ran
   — and then say that the answer is two sessions' worth and it is called session 7.
5. **Wants to double-click the file.** Let him. It is step 7.

## What you may not say

When he cannot find his file: **do not open the file explorer and point.** `pwd` and `ls`
are the answer and he has both.

When he asks what `..` means: "try it and tell me where you ended up" is better than the
answer, and costs one command.

When the failure in step 6 happens: **do not name the fix.** He has everything he needs —
he was in the right directory ninety seconds ago and he can get back.
