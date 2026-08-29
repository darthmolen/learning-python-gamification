# Area 2 — DM Guide

**Who this is for.** Whoever holds the DM seat. In Kitchen Table mode (spec §5.11) that
is his father, who is also a player. Read this once before session 1, and come back to
§4 mid-session, on your phone, while he is staring at `fatal: not a git repository`.

Area 0's guide is still the base document — the keyboard rule, the 90-second rule, the
Socratic ladder, Datamine. Nothing here replaces any of it. This guide carries only what
is different about Area 2, and **two things are different enough to change how you run a
session.**

**First: for four sessions there is almost no Python.** Sessions 1–4 are git, typed at a
terminal. That looks like a step backwards and he may say so. It is not, and §5.7 says
why in one line: the reward for Boss 2 is *the real toolchain*. Everything he has built
so far has been trapped on one laptop. These three weeks are how it gets off.

**Second: this is the area where his mistakes stop being local.** In Area 0 a wrong line
drew a wrong square. In Area 2 a wrong line means his file is not in the clone, on your
machine, in front of you, and there is nothing he can do about it from where he is
sitting. That is the whole point (§2.3, §3 principle 8) and it is also genuinely
uncomfortable. Say out loud, in session 1, that this is coming.

---

## 1. What is different about the shape of a session

The five beats are unchanged — Invasion, hook, work, choice, Journal. Two adjustments:

- **The hook gets shorter, not longer.** Git has a lot of vocabulary and it is tempting
  to explain the object model. Do not. He needs four commands and one true sentence
  about each. Everything else is Area 7.
- **The work beat is now partly *reading*.** `git log`, `git status` and a traceback are
  things he reads, and reading output is a skill with its own stalls. When he runs a
  command and immediately types the next one without looking at what came back, stop
  him. That habit is the single most expensive one he can pick up in this area.

**The one new rule: you still do not touch the keyboard, and it will be harder here.**
A detached HEAD or a merge conflict takes you eleven seconds and him twenty minutes. Take
the twenty minutes. A child who has seen an adult fix git without explaining it has
learned that git is magic, which is the exact belief this area exists to destroy.

---

## 2. Setup, once, before session 1

On the learner's machine:

```
git --version
py -3.14 --version
```

Both must answer. If `git` does not, install it before the session rather than during
it — a session that opens with a download is a session that opens with him watching a
progress bar.

Then, and this is not optional:

```
git config --global user.name "his name"
git config --global user.email "his email, or a made-up one"
git config --global init.defaultBranch main
git config --global core.editor "notepad"
```

**Do all four with him watching, and let him type them.** The first two are the reason
his name appears in `git log`, which is the reason `git log` is interesting to him at all
in session 3. The third stops git printing a paragraph of advice about `master` every
time he runs `git init`. The fourth means that when git opens an editor he did not ask
for — and it will — he gets one he can close.

`core.editor "notepad"` is a deliberate downgrade from vim, and it holds until session 6
gives him VS Code. On a Mac or Linux box use `nano`. Whatever you choose, **make sure you
know how to save and quit in it**, because you will be asked at 7:40pm.

### He needs a repository of his own, and he names it

Spec §7: one repository for all his projects, and he chooses the name. Do not choose it
for him and do not improve his choice. Reason 2 in §7 is that ownership is the cheapest
large dose of autonomy available, and renaming his repository to something sensible spends
it for nothing.

**No hooks, no CI, no ruff, no linter on his repository.** Spec §7 reason 3: *a first
`git commit` rejected by a linter he did not install and cannot read is a bad first day.*
This holds for the whole of Area 2 and it is not a temporary shortcut.

---

## 3. Settle the remote before session 4

**This is a five-minute decision and it must be made before session 4 starts, not during
it.** He needs *a* remote to learn `push`. Three options, in order of preference. All
three teach `git push` identically; they differ only in drama.

### Option A — Gitea on your machine (preferred)

The one that makes the rest of the campaign work: §6.4 makes push the verification
mechanism, §5.6 puts your Journal replies in Gitea as comments, and the "the game
noticed" moment needs it.

It is also the one that is **not ready yet**:
`planning/backlog/feature_gitea-lan-access-for-the-son_2026-08-27.md` records that
`GITEA_DOMAIN` is still `localhost`, so the clone URLs Gitea advertises are wrong from
anywhere except the host, and Windows Firewall has not been opened for 3080 or 3022. That
is infrastructure work and it is not part of this area. **If it is done by week 7, use
it. If it is not, do not delay the session by one day.**

### Option B — a bare repository on a USB stick or a LAN share

```
git init --bare /d/pyquest-remote/his-repo.git         # on the stick, once
git remote add origin /d/pyquest-remote/his-repo.git   # in his repository
git push -u origin main
```

Real push, real remote, real refusal when it is out of date. He can carry it to your desk
and you can clone from it. For Boss 2 this is genuinely sufficient — the win condition is
that his code ran on **someone else's computer**, and a stick carries it there.

### Option C — a second directory on his own laptop

```
git init --bare ~/remotes/his-repo.git
git remote add origin ~/remotes/his-repo.git
git push -u origin main
```

Everything about `push` behaves exactly as it does against a server. What it cannot do is
Boss 2, because the boss needs a second machine. **Option C is a legal way to teach
session 4 and is not a legal way to fight Boss 2.** If you end up here, plan how the
repository reaches your machine before week 8 — a stick, a share, or Gitea finally coming
up.

### What to say when it is B or C

Say the truth, briefly, and move on:

> "This is a folder pretending to be a server. Everything you type is the same as it
> would be against a real one, and when the real one is up you change one line."

He will not care nearly as much as you expect. What he cares about is that the file
appears somewhere he did not put it.

---

## 4. Stalls, by session

Written in the order you will hit them. Each is a real prediction.

*Sessions 5–8 are 2b. Their stalls are here; their session plans are authored separately,
and `README.md` records which of them exist yet.*

### Session 1 — What A Repository Is

| Stall | What is actually wrong | What to ask |
|---|---|---|
| Runs `git init` in his home directory, or in `C:\` | He typed it wherever the terminal happened to open | "Before you press enter — what folder are you in? How do you find out? What do you *want* that answer to be?" |
| `fatal: not a git repository` | He is one directory above or below the repository | "Which folder did you init? Which folder are you in now? Are they the same folder?" |
| Wants to know what is inside `.git` | Nothing is wrong. This is the best question of the night | "Go and look. `ls .git`. Read the names. Which one do you think holds the actual saved files?" |
| Deletes or edits something inside `.git` | It will happen once | "What did the folder look like before? What do you think that file was for? Do you want the whole thing back?" (`rm -rf .git`, then `git init` again — nothing is lost, he has not committed yet) |
| "So it's like Dropbox" | A reasonable and wrong guess | "Dropbox keeps one copy of your file — the newest. How many copies do you think this keeps? Which one does it show you?" |
| "So it's like Minecraft world backups" | A reasonable and nearly-right guess | "Close. What is the difference between a backup and a save you *chose* to make and named? Which one is this?" |

**Let him get wrong:** where `git init` goes. Let him initialise the wrong folder once,
find it with `git status`, and undo it himself. It is a free mistake tonight and an
expensive one in week thirty.

### Session 2 — The First Commit

| Stall | What is actually wrong | What to ask |
|---|---|---|
| Commits without adding, then says nothing happened | He has not met the staging area yet | "Read what git just said to you, all of it. It used the word 'nothing'. Nothing *what*?" |
| Cannot see why `add` and `commit` are two commands | Genuinely the least obvious thing in 2a | "You changed four files tonight. Two are finished and two are a mess. Which ones do you want in the save?" |
| `git add .` for everything, forever | It works, and it will bite him at Boss 2 | "What did that just add? How would you find out? Is there anything in this folder you would not want on my machine?" |
| Commit messages are `stuff`, `stuff2`, `asdf` | Speed | "In six weeks you are going to read this list to work out what you did. Read that one back as if it were six weeks from now." *(Then let it ship. Session 3 collects the bill.)* |
| Git opens vim because he forgot `-m` | The classic | "You are inside a text editor you did not ask for. It is called vim. Type colon, q, exclamation mark, enter." *(Then `git commit -m "message"`, and say that `-m` means 'message'.)* |
| `Please tell me who you are` | The §2 config was skipped | Do the two `git config --global` lines, with him typing. |
| Wants to commit `.venv` or `__pycache__` | Nothing is wrong; this is `.gitignore` arriving on cue | "How many files is that? Did you write any of them? Should something you did not write be in your save?" |

**Let him get wrong:** the commit messages. This is a planted trap and session 3 springs
it. Do not improve his messages tonight.

### Session 3 — The Log As A Story

| Stall | What is actually wrong | What to ask |
|---|---|---|
| `git log` opens a pager and he cannot get out | It is `less`, and nobody guesses this | "Press q. Just q." *(Then teach `git log --oneline` and never mention the pager again.)* |
| His own log is unreadable | Session 2's trap, landing | "You wrote these four days ago. Which one added the staircase? …Right. What would you have had to write to know?" |
| Thinks a branch is a copy of the folder | The most common wrong model, and nearly harmless | "Watch the folder while you switch. Did the number of files change? Where did the other version go?" |
| **Detached HEAD** after checking out a commit hash | He followed his curiosity, which is correct | "Read the whole message git printed. It told you what happened and it told you how to get back. Which line is the instruction?" *(`git switch main`. Nothing is lost. Say that part first.)* |
| A merge he did not ask for, and an editor opens | `git merge` opens the editor for the merge message | "That is git asking you to name what you just did. Close the editor and keep the message it suggested." |
| A merge conflict | Rare with one person, and it will still happen once | "Open the file. Git has written inside it. Read the marks out loud — what do you think the top half is, and what is the bottom half?" |
| Wants to delete a commit he is embarrassed by | Reasonable, and the answer is a good one | "Can you? Should you? What is the log *for* — a record of what you did, or a story about how good you are?" |

**Let him get wrong:** the branch-is-a-copy model. It survives all of Area 2 without
hurting anything, and Area 7 is where it gets corrected properly.

### Session 4 — Push, And It Is Somewhere Else

| Stall | What is actually wrong | What to ask |
|---|---|---|
| `git push` with no remote configured | Nothing has been added yet | "Read the error. It says 'origin'. Have you ever told it what origin is?" |
| Pushes, and nothing changes locally | Correct. Nothing local changes | "Where would you look to find out whether that worked? Not here — somewhere else." |
| `src refspec main does not match any` | He has no commits, or the branch is called `master` | "How many commits does this repository have? What is the branch called? `git log --oneline` and `git status` each answer one of those." |
| Authentication fails against Gitea | Infrastructure, not him | Say so out loud: "This one is mine, not yours." Then fall back to option B or C from §3 and keep the session. |
| "It says everything is up to date, but I changed it" | He edited and did not commit | "Push sends commits. Is your change a commit yet? What does `git status` say?" |
| Not impressed | Fair. A successful push prints four boring lines | Do not sell it. **Show it.** Clone it back into a fresh folder in front of him and open the file. |

**The move that makes session 4 land** is not the push. It is cloning his repository into
an empty directory afterwards, in front of him, and opening his own file out of it. Until
he sees a second copy appear from nothing, `push` is four lines of terminal output.

**Let him get wrong:** forgetting to commit before pushing. It is the most common real
mistake in the whole of git, and the fix is a sentence he should say out loud himself.

### Session 5 — Where A File Actually Goes

| Stall | What is actually wrong | What to ask |
|---|---|---|
| `py -3.14 thing.py` — file not found | He is not in the directory the file is in | "Where is the file? Where are you? Which of those two do you want to change?" |
| Edits one copy and runs another | The same file is open in two places | "How many copies of this file exist on ttheir own machine? How could you prove it?" |
| Types a whole script into the REPL by habit | Areas 0–1 were mostly a prompt | "Which prompt are you at? What happens to everything you typed when you close it?" |
| Uses `python` instead of `py -3.14` | Two interpreters, one machine | "Which Python did that use? What could you print that would tell you?" |
| Wants to double-click the file | Entirely reasonable | "Try it. What happened to the window? Now run it the other way. Which one let you read the error?" |

### Session 6 — A Real Editor

| Stall | What is actually wrong | What to ask |
|---|---|---|
| Runs the file and gets the *old* behaviour | He did not save. The number one VS Code stall | "Look at the tab — is there a dot on it? What does the dot mean?" |
| Opens a *file* rather than a *folder* | VS Code with no folder open is a worse Notepad | "Close it. Open the folder instead. What appeared on the left that was not there before?" |
| The terminal opens in the wrong directory | It opens where the folder is, not where the file is | "What does the terminal think the current folder is? Does that match the file you are looking at?" |
| Wants back the parts the profile removed | Good. That is the ladder, and it starts in Area 3 | "Which one, and what would you use it for? Write that down — you unlock them by needing them." *(See `tools/vscode/README.md`.)* |
| Hunts for a Run button | There is one, and this year it is a trap | "Run it in the terminal. Then press the button. Which of those told you which Python it used?" |

### Session 7 — Its Own Python

| Stall | What is actually wrong | What to ask |
|---|---|---|
| **Forgot to activate the venv** | The defining stall of 2b | "Which Python is running right now? Not which one you meant — which one *is*. How would you find out?" (`py -3.14 -c "import sys; print(sys.executable)"`) |
| `pip install` into the wrong interpreter | The two-interpreter trap this machine really has | "You installed it. It says it isn't there. One of you is talking about a different Python — which one, and how do you check?" |
| Deleted `.venv` and panicked | Nothing is lost. It is the one directory that is disposable | "What is in there that *you* wrote? …Right. So what does that mean you are allowed to do to it?" |
| Committed `.venv` | Very common, and the reason `.gitignore` exists | "How many files did that commit? Did you write any of them? Could you rebuild all of them from one line?" |
| "Why not just install it normally?" | The best question of 2b | "What happens to this project when another project wants a different version of the same thing? Where would that fight happen?" |

### Session 8 — Read The Stack

| Stall | What is actually wrong | What to ask |
|---|---|---|
| Reads the top of the traceback | The bottom is the answer, and this is the third pass at it | "Read it from the bottom. Which of those files did you write?" |
| Panics at a five-frame stack | Four of the frames are inside Python's own code | "Which lines name *your* file? Start there. The rest is Python explaining itself to itself." |
| `if __name__ == "__main__"` reads as noise | It is, right up until the moment it isn't | "Import it and watch what happens. Now put the line back and import it again. What is different?" |
| Cannot see why anyone would import his file | Fair, until Area 4 | "You will, in about six weeks. Tonight just watch what it does when I import it." |

---

## 5. Invasions

Three questions at the start of each session, out loud, no computer, nothing looked up
(§5.4). Two minutes. Retrieval, not recognition.

**Session 2:** What is a repository, in your own words? · What did `git init` actually
create? · Which folder is your repository — how would you prove it?

**Session 3:** What are the two commands that make a save? · Why are they two commands
rather than one? · What does `git status` tell you that you cannot see by looking at the
folder?

**Session 4:** What is in `git log`? · What is a branch, in your own words? · What would a
commit message have to say to be useful to you in November?

**Session 5:** What does `push` send — files, or something else? · Where does it send them?
· What happens if you push without committing first?

**Session 6:** What has to be true about where you are standing for `py -3.14 thing.py` to
work? · What is the difference between the REPL and a file? · Name two ways to find out
which directory you are in.

**Session 7:** What did the editor take away that a normal VS Code has? · What is the dot
on the tab? · How do you open a terminal in the folder you are editing?

**Session 8:** What is a venv, in one sentence? · How do you find out which Python is
running? · Why is `.venv` in `.gitignore`?

**Week 9, opening Area 3:** three of the above at random, plus one from Area 0. Say out
loud that you are doing it on purpose.

---

## 6. The Journal migration, and scoring it

**Session 2 is where the Journal stops being a folder and becomes history.** §5.6 defines
the Journal as committed and pushed; until tonight only the first half of that sentence
has been true, and Area 0's README recorded the deviation openly rather than hiding it.
Tonight it closes.

The beat is simple and it should not be dressed up:

1. He copies **his** journal entries into his repository, into a `journal/` directory.
2. `git add journal/`
3. `git commit -m "my journal so far"`

It works with whatever entries exist on the night — six if only Area 0 has run, sixteen
if Area 1 has too. **Do not count them out loud and do not make the number the point.**
The point is that the first thing under version control in his life is something he
wrote, not an empty README.

Say one sentence about it and no more:

> "That is the first commit in your repository, and it is a hundred per cent your own
> writing. Nothing I wrote is in there."

**Nothing in this repository moves.** The entries are *copied* into his repository. The
curriculum's own copies stay where they are.

### Scoring, unchanged

Ten XP per entry, paid for substance rather than existence (§5.6). The rubric in Area 0's
guide §6 still stands. Two additions for this area:

- **The session-4 entry should name the remote** — which of the three options you used,
  and what actually appeared where. That is the entry he will want in week thirty when he
  moves to Gitea or to GitHub.
- **The Boss 2 entry records the cold clone, pass or fail**, and names the machine. See
  §7. A failure is a scar (§3 principle 5, §5.3) and is written down with the same care
  as a pass — more, because the step that failed is the lesson.

**Your replies move to Gitea when Gitea exists**, and become comments on his commits.
Until then they stay as a line under his entry, exactly as in Area 0. The habit is the
thing; the tooling arrives to a habit that already exists rather than the other way
round.

---

## 7. Boss 2 — the cold clone, step by step

This is the win condition of the campaign's load-bearing area, and **it is a checklist you
work, not a claim you make.** You run it, on your machine, with him watching and not
touching. Say that before you start, so the not-touching is a rule rather than a rebuke.

Boss 2's verifier is `peer-signoff: dm`, and **this checklist is the sign-off.** There is
nothing else to press.

1. **A directory that has never seen his code.** A fresh path outside every existing
   tree — not next to his repository, not a directory that once held it. Anything with a
   stale `.venv`, `__pycache__` or `.env` in it invalidates the run.
2. **Clone by URL, not by copy.** `git clone <remote-url>`. Copying a folder proves the
   code works; cloning proves *he pushed it*, which is the half that fails.
3. **A venv created from scratch**, inside the clone, on your Python. Never a reused
   environment and never one activated from somewhere else. If the project needs
   dependencies they come from a file in the repository — that is what makes `pip` Area
   2b vocabulary rather than trivia.
4. **The exact command comes from his README**, typed as written. If you have to guess
   the entry point, improvise a flag, or ask him what to run, **the boss has not been
   beaten.** §5.3's *no hints* applies to the run, not only to the writing.
5. **"Runs" means it exits 0 and produces the output his own specification says it
   produces.** Not "no traceback". A program that starts, prints nothing and exits
   cleanly has not run in any sense he should be paid for.

**Record it either way.** A pass goes in that session's Journal entry with your machine
named. A failure is a scar, and the scar records **which step** failed, because the step
is the lesson:

| Failed at | The missing idea |
|---|---|
| 1 | What a repository actually contains, as opposed to what his folder contains |
| 3 | What an environment is, and that their machine's Python is not everybody's |
| 4 | Who his code is for. A README is a message to a person who is not him |

### The three failures worth predicting

Every one of these is a real thing an 11-14-year-old does, and each is a different
lesson:

- **A file that was never `git add`ed**, so it is not in the clone. He will insist it
  exists, and he is right — on their own machine. Ask: "Show me `git status` on your machine.
  Read me the untracked list."
- **An absolute path** — `C:\Users\<his name>\Documents\code\...` — written into the file.
  Ask: "That path exists on your laptop. Does it exist on mine? What did you assume?"
- **A dependency he installed globally months ago** and has not thought about since. Ask:
  "It works for you and not for me, and we are running the same code. So what is
  different?"

### What to say when it fails

Nothing consoling, and nothing that softens it. §3 principle 5 is *never hide failure*
and §5.3 gives unlimited attempts:

> "Good. That is the real thing, and it is exactly what happens at work. Which step did
> it die on? Write that down, go and fix it, and we will run it again."

Then actually run it again the same evening if he wants to. Unlimited attempts means
unlimited attempts.

### What to say when it passes

Also short. He will know.

> "Your code just ran on a computer you have never touched. That is the whole of Area 2,
> and you are done with it."

---

## 8. The two places you will be tempted to take the keyboard

Named, because knowing they are coming is most of the defence.

**A detached HEAD.** It looks alarming, git prints a paragraph, and you can fix it in
four seconds. Do not. Git's own message contains the instruction. Make him find the line.
That is the entire skill: *the tool told you what to do and you did not read it.*

**Anything at all during Boss 2.** You are running the clone on your machine, which means
your hands are already on your own keyboard, which makes it feel like your problem to
solve. It is not. If it fails, it fails, and you write down the step. A boss you quietly
fixed is a boss he did not beat.

---

## 9. What you are actually being graded on

Not whether he can recite the git object model. Not whether his commit messages are good.

By the end of Area 2 he should be able to:

- put a folder under version control and get a file into a commit, without help;
- say what `push` does and where it puts things;
- run a Python file from a terminal, in the right directory, on the right interpreter;
- **read a traceback with more than one frame and say which line is his**;
- and, once, watch his own code run on somebody else's machine.

The last one is the trophy. §2.3 diagnoses every platform surveyed as failing at exactly
this seam — graduates who cannot ship anything, having never left the browser sandbox or
learned where a file goes. Three weeks and one uncomfortable evening is what it costs not
to be that.
