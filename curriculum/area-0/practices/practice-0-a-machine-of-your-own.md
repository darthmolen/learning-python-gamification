---
audience: dm
---

# Practice 0 — A Machine Of Your Own

**Concepts:** `git-clone`
**Files:** none. Everything here happens to the machine rather than in it.
**Journal:** none. The journal starts in Practice 1, with something to write about.

**This one is short, and it is meant to be.** Twenty-five minutes, maybe thirty. Do not
stretch it to fill an evening — a setup session that runs long is a setup session that taught
somebody programming is mostly waiting for downloads.

No invasion. There is nothing yet to retrieve.

---

## Why this is a practice and not a footnote

The payload with the instructions in it travels by git. So the instructions for installing git
arrive by the thing they instruct, which is a circle, and the way out is not a cleverer
packaging tool — it is to admit that putting a machine into service is work, do it together,
and give it a number.

Numbering it 0 is the honest part. It says *before the work starts*, which is true, and it
means Practice 1 is still Practice 1 for everybody who has ever talked about this curriculum.

**Say none of that out loud.** What the learner needs is the sentence at the top of Beat 1.

---

## Before they sit down

Three things, on your machine, and all three are yours rather than theirs:

1. **The stack is up and reachable from their machine.** Not from yours — from theirs.
   `tools/git/local-lan-learner.md` has the procedure. Two things are wrong out of the box:
   `GITEA_DOMAIN` defaults to `localhost`, which makes every clone URL Gitea *displays* point at
   whichever machine is reading it, and the firewall has no rule for 3080. Set the domain to the
   host's LAN address and prove the rest with `curl http://<host>:3080/api/healthz` **typed on
   their laptop**.

   **A host cannot test this against itself.** Under WSL mirrored networking it fails from the
   host and works from everywhere else, so a red result on your own machine means nothing and a
   green one proves nothing. Borrow the laptop, or a phone browser.

2. **An account for them.** Yours to create — `gitea admin user create`. Do this before, not
   during; an admin command at the keyboard is you taking the session.

3. **The repository is theirs to name, and the naming is part of the evening.** §7 means it:
   one repository for everything they make this year, called whatever they want.

   Ask the day before so they arrive with an idea. **Expect them to change it on the night
   anyway**, which is fine and costs nothing — see Beat 3.

If any of the three is not done, do not start. Move the evening. A first session spent watching
an adult fight a firewall teaches exactly one thing, and it is not Python.

---

## Beat 1 — The hook (5 minutes)

Say this, more or less:

> Everything you make this year is going to live in one place, and it is going to be yours.
> Not a folder on this laptop that a reinstall eats. A repository — on the machine in the other
> room, backed up, and yours. Tonight we go and get it.

Then ask them the name they picked, and use it out loud from here on. Not "your repo": the
name.

**The point of the beat is ownership, not git.** They should leave the evening able to say
where their work lives and why nothing can casually delete it.

---

## Beat 2 — Python (10 minutes)

They type, you do not.

```
py -3.14 --version
```

It should say 3.14-something.

**If `python` and `py -3.14` disagree, use `py -3.14` everywhere, including out loud.** On the
DM's machine `python` is 3.12 in PowerShell and 3.14 in Git Bash, and a learner who has heard
two commands for one thing will eventually pick the wrong one at the worst moment.
`tools/python/README.md` has the install and the three day-one failures.

Nothing to explain here. It is a version number, it is the right one, move on.

---

## Beat 3 — The repository, and the clone (10 minutes)

Three steps, and **the order matters** — the middle one is yours, and the payload cannot be
pushed to a repository that does not exist yet.

The heading on each step says whose keyboard it happens at. Nothing below is ambiguous about
that on purpose: the one way to lose this beat is for you to reach over.

### 3a — On their machine, in a browser

They sign in at `http://<host>:3080` as themselves, click **New Repository**, and type the name
they picked. They tick *Initialize this repository*, so the clone arrives with something in it
rather than Git's empty-repository warning.

**If they change their mind about the name here, let them.** It costs you one command below, and
it is the only thing in the whole evening that is genuinely theirs to decide.

### 3b — On your machine, in Git Bash

Your keyboard, and the only time tonight it is. Narrate it: *"I'm sending you the files."*

```console
tools/learner-setup/pack.sh --remote http://<host>:3080/<them>/<their-repo>.git
```

Git Bash, not PowerShell — it is a POSIX shell script and says so at the top.

It clones their repository to a temp directory, copies the payload in, pushes it as the
`learner-setup` branch, and deletes the temp copy. Under a minute, and it ends with
`pushed learner-setup`. **If it says anything else, stop and read it. Do not go on to 3c.**

**Why this cannot be done in advance if they named it tonight**, which is the whole reason this
step exists: the branch has to be pushed to a repository that already exists, so a name chosen
at 3a means a push at 3b. Doing it the day before is fine too, and then this step reports that
the branch already carries the payload and changes nothing.

### 3c — On their machine, at a terminal

**They type every line of this. All of it.** The whole of `git-clone`, and no more git than that.

```console
git clone http://<host>:3080/<them>/<their-repo>.git
cd <their-repo>
dir
```

`dir` lists the folder. **They read what it prints, not you** — ask them what they see rather
than looking at the screen yourself and telling them.

**What to say when they ask what a repository is:** that it is a folder the other machine is
also keeping, that it comes back if this laptop dies, and that Area 2 is four sessions about
exactly this question. Then stop. The full answer costs twenty minutes tonight and is the
subject of a whole area later, where it lands on somebody who has been using one for five
weeks and has actual questions.

That deferral is the same move Area 0 already makes with types: they meet `str` and `float` by
accident in Practices 1 to 3, and Practice 4 names what they have already tripped over. Meeting
a repository before it is explained is a feature.

**Still their machine, still their keyboard** — they switch to the branch:

```console
git fetch
git checkout learner-setup
dir
```

`git fetch` is there rather than assumed. A clone taken at 3c already has the branch, so the
fetch reports nothing and the checkout works — but if 3b ran *after* they cloned, the fetch is
the step that makes the branch exist locally. One command that is right either way beats two
that depend on an order nobody will remember.

**The second `dir` is the point of the whole beat.** The folder had one file a moment ago and
now has a dozen. Ask them what changed before you say anything: files arriving from another
machine because they asked for them is the entire idea, and it is the only time this year they
will see it happen from nothing.

`SETUP.md` is now in front of them. It is written to them, not to you — read the first page
together and then let them drive.

---

## What you may not say

- **"You'll understand this later."** True, and it teaches them that not understanding is the
  normal state of this room. Say *"that's Area 2, four sessions on it"* — a promise with a date
  on it rather than a shrug.
- **"Just copy this."** Every command tonight is short enough to type. Typing a command they do
  not understand is still typing, and it is how the fingers learn before the head does.
- Anything about branches. `checkout learner-setup` is a magic word tonight and that is fine.

---

## Where they will stall

| Stall | What is actually wrong | What to ask |
|---|---|---|
| `git: command not found` | git is not installed on their machine | "What did it say it could not find?" Then install it — `tools/git/README.md` — and re-run |
| `could not resolve host` | `GITEA_DOMAIN` is still `localhost`, or they typed yours | "Which machine is that name pointing at?" |
| Connection times out | the firewall rule was never added | Yours to fix, not theirs. Do it, out loud, and say what you are doing |
| Asked for a password and it failed | Caps Lock, or the account was made with a different one | Reset it rather than debugging it in front of them |
| `cd` into the wrong folder | the clone made a directory and they are above it | "What did `dir` show right after the clone?" |
| `pathspec 'learner-setup' did not match` | **3b did not run, or ran against a different repository name** | Yours, not theirs. Check the name in the URL you packed against the one they made, then re-run 3b and have them `git fetch` again |
| The clone is empty apart from `README.md` | 3b has not run yet | The same. `git fetch` after it does, and 3d works |

**Let them get wrong:** typing the URL rather than pasting it. They will typo it, get a clear
error, and fix it. That is the first time this year the computer will tell them precisely what
is wrong, and it is worth the ninety seconds.

---

## If it goes badly

If the network fights you, stop trying to teach and just fix it. Say so plainly — *"this is my
problem, not yours, give me five minutes"* — because the alternative is a learner who thinks
their first evening was their fault.

If it cannot be fixed tonight, run Practice 1 anyway. Area 0 needs nothing but Python, a
terminal and an editor, by design (spec §8), and the repository can arrive next time. **Do not
cancel the evening over infrastructure.** Practice 1 is the one that decides whether they come
back.

---

## What you are being graded on

That they finish able to say, without prompting, where their work lives.

Not that they can explain a clone. Not that they know what a branch is. One sentence about
ownership, in their own words, and the rest of the year has somewhere to go.
