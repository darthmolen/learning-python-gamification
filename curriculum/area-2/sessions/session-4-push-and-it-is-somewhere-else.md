# Session 4 — Push, And It Is Somewhere Else

**Concepts:** `git-push` · resurfaces `git-log`, `git-commit`, `repository`
**Files:** `exercises/session-4/`
**Journal:** the entry names the remote, and what appeared where

**Decide the remote before you sit down.** `dm-guide.md` §3 gives three options in
preference order — Gitea, a bare repository on a stick or a share, a second directory on
his own laptop. Pick one, get the address written down, and do not spend session time on
it. If Gitea authentication fails at 7:15pm, fall back to option B or C without
apologising and keep the session.

This is the last 2a session and the end of the half. Everything after it needs Python
files in real directories.

---

## Beat 1 — Invasion (3 minutes)

1. What is in `git log`?
2. What is a branch, in your own words?
3. What would a commit message have to say to be useful to you in November?

Then read back last session's forecast.

---

## Beat 2 — The hook (8 minutes)

Two commands and one uncomfortable question.

```
git remote -v
```

Nothing. There is no *away*.

```
git log --oneline
```

However many commits are in there — his journal, his motto, his branch, his merge.

Then the question, and let it land properly rather than rushing past it:

> "Every one of those exists in exactly one place, on one laptop, in one folder. What
> happens to all of it if ttheir own machine gets dropped tomorrow?"

Do not soften the answer. It is gone. All of it.

> "Tonight it stops being true."

**Do not oversell what happens next.** A successful push prints four boring lines and he
will not be impressed. The impressive part is beat 3 step 5 and it is worth saving.

---

## Beat 3 — The work (30 minutes)

### `exercises/session-4/w4_push_and_prove_it.md`

Check first that `git status` says **working tree clean**. Push sends commits; an
uncommitted change does not exist as far as push is concerned, and starting dirty causes
a confusion in step 4 that costs ten minutes.

- **Step 2 — `git remote add origin <address>`.** Say the one true thing about `origin`:
  it is a nickname, not a git word. He could have called it `dad`. Half of what looks like
  magic in git is somebody else's naming convention, and knowing which half is which is
  most of being comfortable with it.
- **Step 3 — `git push -u origin main`.** He reads the output. It is boring on purpose.
  `-u` means he only ever types the long form once per repository.
- **Step 4 — nothing happened.** His folder is unchanged, his log is unchanged, his files
  are unchanged. That is correct and it is why push feels like nothing the first time.

### Step 5 — the step that makes the session land

**Do not skip this and do not let him skip it.** It is the whole beat.

```
cd ~
mkdir proof
cd proof
git clone <the same address>
```

A folder appears out of nothing with all of his work in it. His motto, his journal, his
commit messages, his branch, his merge. Then:

```
py -3.14 motto.py
```

His code, running out of a folder he did not put anything into.

Say one sentence, and it is a deliberate advertisement:

> "In four sessions I do exactly this on my computer, and whether it works is the whole
> of Area 2."

### Step 6 — find what did not make it

Compare the clone against his real folder. **There will be something missing.** There
nearly always is.

Two reasons, and only one of them is fine:

| Missing because | Verdict |
|---|---|
| `.gitignore` is hiding it | Correct. That is the file doing its job |
| He never `git add`ed it | **This is how Boss 2 fails**, and finding it tonight is cheap |

Make him write down which one it was. This is the single most valuable thirty seconds in
the session after step 5.

### Step 7 — push a second time

He copies in `receipt.py`, runs it, answers its questions, does its YOUR MOVE steps,
commits and pushes with plain `git push`. Then `git pull` inside the `proof` clone and the
file arrives.

`receipt.py`'s YOUR MOVE step 2 is a deliberate Area 0 callback: `input` handed back a
`str` and it cost him a `TypeError` in week two. Ask him to **prove** it rather than
remember it. He knows how.

### Step 8 — delete the proof

```
cd ~
rm -rf proof
```

Deliberately, in front of him. He made a complete copy of everything he owns and destroyed
it and lost nothing. He should feel exactly how strange that is, because it is the
strangest true thing in this area.

---

## Beat 4 — Choice board (in the work time)

- **The Race** — clone into `proof` again, commit something *in the clone*, and push it
  from there. Then pull it into the original. Two working copies of one repository, which
  is the shape all real work has.
- **The Rejection** — commit something different in each of the two clones and try to push
  both. Git refuses the second one. Read the refusal; do not fix it tonight.
- **The Tag** — `git tag area-2a`, push it, and see it appear on the remote. Spec §5.6
  has him writing release notes against real version tags at the end of every area, so
  this is that arriving early and cheaply.
- **Something else** — anything, as long as he says what he expects first.

---

## Beat 5 — Journal (5 minutes)

**Tonight's entry must name the remote** — which of the three it was, the address, and
what actually appeared where. It is the entry he will want in week thirty when the
repository moves to Gitea properly, or at thirteen when it moves to GitHub.

Then commit it, and push it. First journal entry in history to be pushed anywhere.

---

## The half ends here

Say so, briefly. Sessions 5 to 8 are a different kind of evening: Python files in real
directories, a real editor, and a Python that belongs to one project. Tell him the reward
for Boss 2 is the real toolchain (§5.7) and that he has now got the half of it that moves
code between machines.

---

## Where he will stall

See `dm-guide.md` §4. The predicted four:

1. **`git push` before `git remote add`.** The error names `origin`. Ask whether he has
   ever told git what that is.
2. **`src refspec main does not match any`.** No commits, or the branch is `master`.
   `git log --oneline` and `git status` answer one each.
3. **"Everything up to date, but I changed it."** He edited and did not commit. Push sends
   commits.
4. **Authentication failure against Gitea.** Not his. Say so out loud — "this one is
   mine" — and fall back to option B or C.

## What you may not say

When the push fails for an infrastructure reason: **do not debug it in front of him for
twenty minutes.** Say it is yours, switch to option B or C, and finish the session.
Watching an adult fight a server is not a lesson; it is the session being eaten.

When he asks what `-u` does: "run `git push` without it next time and see what happens" is
better than the answer, and it costs him one command.
