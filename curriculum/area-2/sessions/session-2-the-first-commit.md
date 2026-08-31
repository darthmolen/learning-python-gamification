# Session 2 — The First Commit

**Concepts:** `git-add` · `git-commit` · resurfaces `repository`
**Files:** `sessions/session-2/`
**Journal:** the migration, and then the entry

**This is the session the Journal has been waiting for since week one.** Spec §5.6
defines the Journal as *committed and pushed*, and Area 0's README recorded openly that
only the first half of that was true. Tonight it closes, and the first commit in his
repository is sixteen — or six — entries of his own writing.

It is also the session with the one genuinely non-obvious idea in Area 2a: why `add` and
`commit` are two commands and not one.

---

## Beat 1 — Invasion (3 minutes)

1. What is a repository, in your own words?
2. What did `git init` actually create?
3. Which folder is your repository — how would you prove it?

Question 3 is the useful one. The answer is `git status`, and if he reaches for it
without being told, session 1 landed.

---

## Beat 2 — The hook (8 minutes — keep it short, the work is long tonight)

**Open with the migration, not with the commands.** This is the emotional beat of the
whole area and it should not come after twenty minutes of terminal.

Say roughly this:

> "Before anything else tonight. You have been writing in that journal since week one.
> Copy the whole lot into your repository, into a folder called `journal`."

Let him do it. Then:

```
git status
```

It lists them. All of them, under **untracked**.

> "Read that word. Git can see them. It is not looking after a single one of them."

Then the three commands, which he types:

```
git add journal
git commit -m "my journal so far"
```

And one sentence, and then stop talking:

> "That is the first commit in your repository, and it is a hundred per cent your own
> writing. Nothing I wrote is in there."

**Do not count the entries out loud and do not make the number the point.** Six is as good
as sixteen. The point is that the first thing under version control in his life is
something he made.

**Nothing in the curriculum repository moves.** He *copies* his entries. The originals
stay where they are.

---

## Beat 3 — The work (30 minutes)

### `sessions/session-2/w2_the_first_commit.md`

He works it from step 3 onward, since the hook covered steps 1 and 2.

**Step 3 is the session.** The walkthrough asks him the question before answering it:

> "Why are `add` and `commit` two different commands, when every other program on this
> laptop has one Save button?"

**Make him actually try to answer before he reads on.** Ninety seconds of silence. This is
the one idea in 2a that does not arrive by itself, and an answer he attempted first
sticks about four times better than the same paragraph read cold.

If he is stuck, do not answer it. Give him the situation instead:

> "You changed four files tonight. Two are finished and two are a mess. One Save button
> saves all four. What do you actually want?"

Then let the walkthrough say it: `add` chooses, `commit` seals. The pile he has `add`ed
is the **staging area** — a box he is filling, not a save.

### Step 5, and the reading discipline

Five commands in order, and **he reads the output of every one before typing the next**:

```
git status
git add motto.py
git status
git commit -m "a motto"
git status
```

Three `git status` runs saying three different things. If he races through them the
session has failed and it will not look like it has, so watch for it. When he types the
next command without reading the last output, stop him and ask what the last one said.

### Step 6 — the one that catches everybody

He edits the motto after committing it, runs `git status`, and it has noticed.

> "You did not ask it to look. Where is it comparing your file to?"

Not to the file — it is looking at the file. It is comparing the file to the commit he
made ninety seconds ago. **That comparison is what a repository is for**, and this is the
moment it becomes concrete.

### Step 7 — `.gitignore`

He copies `gitignore.txt` in, renames it, reads the comments, and commits it.

The line worth saying out loud, once:

> "The list of things git should ignore is itself a thing git remembers. It has to be, or
> it would only work on your laptop."

Three of the patterns protect him from things he has not met — `.venv/` is five sessions
away. Say that they are there on purpose and move on.

---

## Beat 4 — Choice board (in the work time)

- **The Archaeologist** — commit something, delete the file entirely, and get it back.
  (`git restore <file>`, and he should find the command in what `git status` prints
  rather than from you.)
- **The Careful Commit** — change two files, commit only one of them on purpose, and show
  with `git status` that he did exactly that. This is the staging area used for its
  actual purpose.
- **The Empty Commit** — try to commit with nothing staged and read what git says. It is
  a whole paragraph and every line of it is useful.
- **Something else** — anything, as long as he can say what he expected and what happened.

---

## Beat 5 — Journal (5 minutes)

Entry as normal, and it now lives in the repository. **He commits it at the end of the
session**, which is the habit that has to survive the year:

```
git add journal
git commit -m "session notes"
```

Your reply still goes underneath, in the file, as it did in Area 0. When Gitea is up it
becomes a comment on the commit and the habit is already there waiting for it.

For **what will break next time**: he is about to read his own commit messages back.
Prompt for a forecast about that specifically, and read it back to him at the start of
session 3, because it is going to be right.

---

## The trap you are setting on purpose

**Do not improve his commit messages tonight.** He will write `stuff`, `stuff2` and
`asdf`, and every instinct will tell you to intervene.

Let it ship. Session 3 opens with him trying to read his own log and failing, and the bill
arriving four days later in his own handwriting is worth more than any amount of advice
given tonight.

---

## Where he will stall

See `dm-guide.md` §4. The predicted four:

1. **Commits without adding**, then says nothing happened. Git told him, in a sentence
   containing the word "nothing". Make him read it.
2. **Cannot see why `add` and `commit` are separate.** The most legitimate confusion in
   2a. Use the four-files question above; do not shortcut to the answer.
3. **`git add .` for everything.** It works and it will bite at Boss 2. Ask what it just
   added and how he would find out.
4. **Vim, because he forgot `-m`.** `:q!`, then `git commit -m "..."`, then say that `-m`
   means message.

## What you may not say

When his commit messages are bad: **nothing at all.** Not tonight.

When he asks whether `add` is the same as saving the file in the editor: do not say no.
Ask "what happens if you `add` a file and then edit it again — which version is in the
box?" He can find that out in about forty seconds and it will settle the question
permanently.
