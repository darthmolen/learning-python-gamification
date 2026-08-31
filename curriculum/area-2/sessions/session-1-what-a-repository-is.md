# Session 1 — What A Repository Is

**Concepts:** `repository` · `git-init`
**Files:** `sessions/session-1/`
**Journal:** the first Area 2 entry

Git is normally taught as a list of commands, and the list works right up until the
first time something surprising happens, at which point the learner has no model to
reason with. This session teaches **one idea and one command**, and spends most of its
time making the idea concrete enough to argue with.

The idea: a repository is a folder that keeps every version of itself you chose to keep.

---

## Beat 1 — Invasion (3 minutes)

There is no Area 2 material to retrieve yet, so pull from Area 0 and Area 1. Three, out
loud, no computer.

Pick from: what kind of thing does `input` always hand back? · what does `range(1, 5)`
produce, and how many numbers is that? · which line of a traceback do you read first? ·
what does the `f` in front of a string do?

Say out loud, once, that you are asking about six-week-old material on purpose. He
should know retrieval is a mechanism and not a quiz.

---

## Beat 2 — The hook (10 minutes)

**Give him the problem before you give him the tool.** No computer for this.

Ask him to name a file on their own machine — game, homework, Minecraft world, anything — that
exists in more than one copy because he was about to change something and did not want
to lose the old one. He will have several. Let him list them.

Then ask the two questions that do the work:

> "Which one is the newest? How do you know?"
>
> "What was different about the one you kept? Not the name. What was actually different
> inside it?"

He will not know the second one. Nobody does. That is the whole problem, and he has been
living with it for years without a name for it.

Then say the sentence, once, plainly:

> "Tonight your code folder becomes the only folder on this machine that can answer both
> of those questions about itself, forever, for free."

**Do not explain the object model.** Not blobs, not trees, not SHAs. He needs one true
sentence and one command tonight; everything else is Area 7 and saying it now buys
nothing but a glazed expression.

### The one comparison worth making, and the one worth refusing

He will offer *"so it's like Dropbox"* or *"like Minecraft backups"*. Both are useful and
neither is right. Do not correct either one — ask instead:

- **Dropbox:** "How many copies does Dropbox keep? Which one does it show you?"
- **Minecraft backups:** "What is the difference between a backup and a save you *chose*
  to make and gave a name to?"

The second one is close enough that it is worth letting him get there himself.

**Refuse this one, if he offers it:** *"so it saves automatically."* Git never saves
anything you did not tell it to save, and that single misconception causes more grief
over a lifetime than every git command combined. Say so now, in one sentence, and it
will be re-taught properly next session anyway.

---

## Beat 3 — The work (25–30 minutes)

### Setup, before he touches git

The four `git config --global` lines from `dm-guide.md` §2, with **him** typing:

```
git config --global user.name "..."
git config --global user.email "..."
git config --global init.defaultBranch main
git config --global core.editor "notepad"
```

Do not treat these as boilerplate to be got out of the way. Say what the first two are
for — his name is about to start appearing next to things he did, permanently — because
that is why `git log` is interesting to him at all in session 3.

### He names his repository

Spec §7 reason 2: ownership is the cheapest large dose of autonomy available. **He picks
the name, you do not improve it, and you do not visibly react to it.** It will be a
Minecraft reference. Good.

### `sessions/session-1/w1_the_folder_that_remembers.md`

Copy `still_works.py` into his folder first, so there is something in there to run.

Then he works the walkthrough. Seven numbered steps, and the two that matter are 3 and 4:

- **Step 3** is `git status` *before* `git init`, and the refusal it prints. Make him read
  the whole line. It says git looked in this folder **and every folder above it**, which
  is most of a mental model handed over for free.
- **Step 4** is `git init`, then counting the files. Same number. Nothing moved. **This
  is the moment to make him look**, because the fear that git will do something to his
  files is the fear that makes people avoid it for years.

### Look inside `.git`

Step 5 of the walkthrough. He opens it, reads the names, and writes down two guesses:
what is in `HEAD`, and what goes in `objects`. Session 3 checks both.

The point is not the answers. The point is that **git is a program that writes files in a
folder**, which is a thing he can look at, rather than a magic service, which is not.

He may break something in there. It is fine — he has no commits yet, so `rm -rf .git` and
`git init` again costs nothing. Say that out loud *after* he breaks it, not before.

---

## Beat 4 — Choice board (in the work time)

He picks one. Not you.

- **The Spelunk** — go through every name in `.git` and write one guess per name about
  what it is for. Session 3 marks them.
- **The Second Repository** — `git init` an empty throwaway folder somewhere else, and
  find out what is different about a `.git` with nothing in it yet.
- **The Undo** — delete `.git` entirely, prove with `git status` that the repository is
  gone, and then bring it back. Learning that a repository can be destroyed and recreated
  in two commands is worth a lot of confidence.
- **Something else** — anything, as long as he can say afterwards what he found out.

---

## Beat 5 — Journal (5 minutes)

Same four prompts. Open by reading back what he predicted at the end of his last session.

Tonight's entry is the last one that lives only in a folder. Do not announce that — it is
a better surprise next session.

For **what broke**: if he says nothing broke, ask what `git status` did the first time he
ran it. Something refused him within the first five minutes.

---

## Where he will stall

See `dm-guide.md` §4. The predicted three:

1. **`git init` in the wrong folder.** Let it happen. `git status` finds it and he undoes
   it himself. A free mistake tonight, an expensive one in week thirty.
2. **`fatal: not a git repository`** because he is one directory up or down. The question
   is "which folder did you init, and which are you in now?", not the answer.
3. **"So it's like Dropbox."** Not a stall, a model. Ask the two questions above and let
   him repair it himself.

## What you may not say

When he cannot get `git status` to work: **do not type `cd` for him.** Ask "what folder
are you in, and how would you find out?" `pwd` is the answer and he already knows it from
the walkthrough.

When he asks what is inside `.git/objects`: **do not tell him.** "Go and look" is the
answer, and if looking does not settle it, "write down your guess and we will check it in
two sessions" is the answer after that.
