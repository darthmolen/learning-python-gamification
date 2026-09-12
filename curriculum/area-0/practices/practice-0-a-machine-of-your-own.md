---
audience: dm
---

# Practice 0 — A Machine Of Your Own

**Concepts:** `git-clone`
**Files:** none. Everything here happens to the machine rather than in it.
**Journal:** none. The journal starts in Practice 1, with something to write about.

**This one is short.** Twenty-five minutes, maybe thirty. Do not
stretch it to fill an evening — a setup session that runs long is a setup session that taught
somebody programming is mostly waiting for downloads.

No invasion. There is nothing yet to retrieve.

---

## The setup cannot arrive by the thing it sets up

The payload with the instructions in it travels by git. So the instructions for installing git
arrive by the thing they instruct, which is a circle, and the way out is not a cleverer
packaging tool — it is to admit that putting a machine into service is work, do it together,
and give it a number.

Numbering it 0 is the honest part. It says *before the work starts*, which is true, and it
means Practice 1 is still Practice 1 for everybody who has ever talked about this curriculum.

**Say none of that out loud.** What the learner needs is the sentence at the top of Beat 1.

---

## Before they sit down

Three things on the host (or your machine if running locally) before the learner(s) start:

1. **The stack is up and reachable from their machine.**.
   `tools/git/local-lan-learner.md` has the procedure. Two things are wrong out of the box:
   `GITEA_DOMAIN` defaults to `localhost`, which makes every clone URL Gitea *displays* point at
   whichever machine is reading it, and the firewall has no rule for 3080. Set the domain to the
   host's LAN address and prove the rest with `curl http://<host>:3080/api/healthz` **typed on
   their laptop**.

   **A local host running WSL and Docker Desktop cannot test this against itself.** Under
   mirrored networking it fails from the host and works from everywhere else, so a red result on your own machine means nothing and a green one proves nothing. Borrow the laptop, or a phone browser.

2. **An account for them.** — `gitea admin user create`. Do this before, not
   during; an admin command at the keyboard is you taking the session.

3. **The repository is theirs to name and is part of the evening.** §7 means it:
   one repository for everything they make this year, called whatever they want. Try Ask the day
   before.

4. Write the host name down in both forms, both IP and hostname so that it can be easily
   referenced while you are working with the learner.
Do not start if the above 4 pre-reqs are not met. Move the evening. A first session spent watching an adult fight a firewall teaches exactly one thing, and it is not Python.

---

## Beat 1 — The hook (5 minutes)

Say this (paraphrasing is fine):

> Everything you make this year is going to live in one place, and it is going to be yours.
> Not a folder on this laptop that a reinstall eats. A repository — on the machine in the other
> room, backed up, and yours. Tonight we go and get it.

Then ask them the name they picked and use it instead of anything that smells of "repository".

**Ownership, not git, is the principle being distilled.** They should leave the evening able to
say where their work lives and why nothing can casually delete it.

---

## Beat 2 — Python (10 minutes)

They do the typing.

```bash
py -3.14 --version
```

It should say 3.14-something.

**Use `py -3.14` everywhere.** Pathing issues could lead to `python` being 3.12 in PowerShell and 3.14 in Git Bash and the ambiguity could lead to unpredictable results. Refer to `tools/python/README.md` for the install and the three day-one failures if errors are encountered.
Any failure should pause or push off the session until a later date while the problem is being
fixed.

---

## Beat 3 — The repository, and the clone (10 minutes)

Three steps in this practice because the payload cannot be pushed to a repository that does not
exist yet.

The heading on each step says whose keyboard it happens at. It's a great activity if running at
home to collaborate together and talk about what is happening. If not collocated, these steps will need to be done in the order presented, but don't have to happen all at once.

### 3a — On their machine, in a browser

They sign in at `http://<host>:3080` as themselves, click **New Repository**, and they type the name they picked. They tick *Initialize this repository*, so the clone arrives with something in it rather than Git's empty-repository warning.

### 3b — On your machine, in Git Bash

As you are doing your part, feel free to narrate it: *"I'm sending you the files."*

```bash
tools/learner-setup/pack.sh --remote http://<host>:3080/<them>/<their-repo>.git
```

Git Bash, not PowerShell — it is a POSIX shell script and says so at the top.

It clones their repository to a temp directory, copies the payload in, pushes it as the
`learner-setup` branch, and deletes the temp copy. Under a minute, and it ends with
`pushed learner-setup`. **If it says anything else, stop and read it. Do not go on to 3c.**

### 3c — On their machine, at a terminal

**Theirs to type, one line at a time.** Replace the obvious place holders with the information
that's been collected while setting up the host and in this session.

```bash
git clone http://<host>:3080/<them>/<their-repo>.git
cd <their-repo>
dir
```

`dir` lists the folder. Ask them what they see instead of just telling them what happened.

**What to say when they ask what a repository is:** that it is a folder the other machine is
also keeping, that it comes back if this laptop dies, and that this tool will be discussed later in the curriculum.

**Still their machine, still their keyboard** — they switch to the branch:

```bash
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
