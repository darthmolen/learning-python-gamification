# Session 3 — The Log As A Story

**Concepts:** `git-log` · `git-branch` · resurfaces `git-commit`
**Files:** `exercises/session-3/`
**Journal:** entry as normal, committed

Session 2 planted a trap. This session springs it, and then uses the resulting motivation
to teach the only thing in 2a that people find genuinely strange: that a branch is not a
copy of anything.

**"Branches, lightly"** is spec §4's phrase and `concepts.ts` labels the concept exactly
that. One branch, one merge, read the log, done. Do not inflate it. Merge strategy,
rebasing and pull requests are Area 7 and there is a reason they are.

---

## Beat 1 — Invasion (3 minutes)

1. What are the two commands that make a save?
2. Why two and not one?
3. What does `git status` tell you that you cannot see by looking at the folder?

Then read him back his session-2 forecast about what would break. It is probably about to
come true in beat 2, which makes it the best possible advertisement for the fourth
Journal prompt.

---

## Beat 2 — The hook (10 minutes)

```
git log
```

The pager opens and he cannot get out. **Nobody guesses `q`.** Tell him — this one is
trivia, not a lesson, and making him find it wastes the beat.

Then the version he will use for the rest of his life:

```
git log --oneline
```

Now the trap. Point at a commit in the middle of the list — one of his — and ask:

> "What did you change in that one?"

He cannot say. He wrote it four days ago and the message says `stuff2`.

**Do not say I told you so, because you deliberately did not tell him.** Say this instead:

> "Right. Four days. Not four months. What would that line have had to say for you to
> know?"

And make him write the answer down. That sentence is worth more than any rule about
commit messages you could have given him last week, because it is his.

### The test, stated once

The test is not "is it a good sentence". The test is:

> **Could I find this commit again by reading only the list?**

The walkthrough has the table of bad messages and what is wrong with each. Let him read
it rather than reciting it at him.

---

## Beat 3 — The work (30 minutes)

### `exercises/session-3/w3_the_log_as_a_story.md`

**Steps 2 to 6 are the session, and the order is load-bearing.** He will want to race
ahead to the merge. Do not let him skip step 5.

- **Step 2** — he edits `streak.py` on `main` and commits it with a message that passes
  the test. One commit, written properly, by choice.
- **Step 3** — `git switch -c longer-entries`, then `ls`. **Same files, same number.** Make
  him look. The wrong model — a branch is a copy of the folder — is forming right now and
  this is the cheapest moment to interrupt it.
- **Step 4** — the actual work on the branch: raise `words_each`, add a line printing the
  average from `total` and `entries`. That is Area 1 vocabulary he already owns, so the
  Python costs him nothing and the git is the whole content.
- **Step 5** — `git switch main`, open the file, **his change is gone.**

  This is the moment of the session. Say nothing. Let the ninety seconds run. He will
  look genuinely alarmed and that is correct — everything he knows about files says
  something has been destroyed.

  Then one question, and only this one:

  > "Where do you think it went?"

  Then let him check by switching back. Nothing was lost, nothing was copied, no file was
  ever in two places. **What moved was him.**

- **Step 6** — `git merge longer-entries`, and then:

  ```
  git log --oneline --graph --all
  ```

  A fork and a join, drawn in `|` and `\` and `/`, and it is a picture of a decision he
  made twenty minutes ago. This is the payoff for the whole session and it is worth
  sitting and looking at.

### Step 7 — mark his session-1 guesses

He wrote down guesses about `HEAD` and `objects` two sessions ago. Now:

```
cat .git/HEAD
ls .git/refs/heads
```

`HEAD` is a one-line file naming the branch he is on. **That one line is the entire
mechanism behind step 5** — switching rewrites it, and then git makes the folder match.

Being wrong here is worth more than being right. Ask what he had it wrong *instead of*,
not just whether he was right.

---

## Beat 4 — Choice board (in the work time)

- **The Time Traveller** — `git switch --detach <a commit hash from the log>`, look at the
  files, and get back. **He will land in a detached HEAD, which is the point.** Git prints
  a paragraph containing the instruction to escape. He finds the line, not you.
- **The Abandoned Branch** — make a branch, commit something bad on it, switch back to
  `main` and never merge it. Prove with `git log --oneline --graph --all` that it is still
  there and is bothering nobody.
- **The Better Log** — try `git log --stat`, `git log -p`, `git log --oneline -3`. Pick a
  favourite and say why.
- **Something else** — anything, as long as he can say what he expected first.

---

## Beat 5 — Journal (5 minutes)

Entry, then commit it, with a message that passes tonight's own test. He will notice the
joke.

For **what I would do differently**: the answer is sitting right there in his log, and
this is one of the few evenings where that prompt has an obvious and honest answer. Let
him write it.

---

## The argument worth having

He will want to delete or reword a commit whose message embarrasses him. He can, and the
answer is no, and it is worth ten minutes rather than a ruling:

> "Is the log a record of what you did, or a story about how good you are?"

Spec §3 principle 5 is **never hide failure**, and §5.3 puts failed boss attempts on
display as scars. His log is the first place in the campaign where that stops being a
slogan and starts costing him something he would rather not show. Say that out loud — the
principle is more convincing when it is expensive.

(Rewriting history is real, it is `rebase`, and it is Area 7. Say so. "Not yet" is a much
better answer than "you can't".)

---

## Where he will stall

See `dm-guide.md` §4. The predicted five:

1. **The pager.** `q`. Just tell him.
2. **His own unreadable log.** The planted trap. Do not soften it.
3. **Branch-as-a-copy.** Have him watch the folder while switching. If it survives
   tonight, it survives — it is harmless until Area 7.
4. **Detached HEAD**, from the choice board. Git's own message has the instruction. He
   reads it.
5. **A merge editor opening unasked.** It is git asking him to name what he just did. Keep
   the suggested message and close it.

## What you may not say

At step 5, when his change has "disappeared": **do not reassure him and do not explain.**
The alarm is the teaching. Ask where he thinks it went, and wait.

When the merge editor opens: do not touch the keyboard. Tell him which two keys, and let
his hands do it.
