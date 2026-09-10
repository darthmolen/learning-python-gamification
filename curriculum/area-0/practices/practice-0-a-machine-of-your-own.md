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
   `tools/git/local-lan-learner.md` has the procedure and the two things that are wrong out of
   the box: `GITEA_DOMAIN` still says `localhost`, and the firewall has no rule for 3080. Prove
   it with `curl http://<host>:3080/api/healthz` **typed on their laptop**. A check run on the
   host passes while the thing you need fails.
2. **An account for them, and a repository they will name.** The account is yours to create
   (`gitea admin user create`). The repository name is theirs to choose, and §7 means it: one
   repository for everything they make this year, called whatever they want. Ask them the day
   before so they have had time to think, and so the evening does not open with a decision.
3. **`pack.sh --remote <their clone url>`**, once the repository exists. That puts the payload
   on the branch before they have ever opened a terminal, so Beat 3 is a `git checkout` rather
   than a wait.

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

## Beat 3 — The clone (10 minutes)

The whole of `git-clone`, and no more of git than that.

```console
git clone http://<host>:3080/<them>/<their-repo>.git
cd <their-repo>
```

Then `ls`, and let them look.

**What to say when they ask what a repository is:** that it is a folder the other machine is
also keeping, that it comes back if this laptop dies, and that Area 2 is four sessions about
exactly this question. Then stop. The full answer costs twenty minutes tonight and is the
subject of a whole area later, where it lands on somebody who has been using one for five
weeks and has actual questions.

That deferral is the same move Area 0 already makes with types: they meet `str` and `float` by
accident in Practices 1 to 3, and Practice 4 names what they have already tripped over. Meeting
a repository before it is explained is a feature.

**Then the branch:**

```console
git fetch
git checkout learner-setup
```

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
| `cd` into the wrong folder | the clone made a directory and they are above it | "What did `ls` show right after the clone?" |

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
