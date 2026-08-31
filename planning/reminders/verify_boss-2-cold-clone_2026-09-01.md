# Run Boss 2's cold clone, and record which step it lands on

**Category:** verify
**Audience:** dm
**Subject:** session
**Raised:** 2026-08-31
**Plan:** `planning/**/feature_area-2-scribes-rite-and-sandbox_2026-08-28.md`
**Status:** open

## What to do

At the end of Area 2, on **the dm's machine**, with the learner watching and not touching.
The procedure is authored in the plan under *"The cold clone, defined"*; the short form:

1. **A directory that has never seen his code.** A fresh path outside every existing tree. A
   stale `.venv`, `__pycache__` or `.env` invalidates the run.
2. **Clone by URL, not by copy.** `git clone <remote-url>`. Copying a folder proves the code
   works; cloning proves *he pushed it*, which is the half that fails.
3. **A venv created from scratch**, inside the clone, on the dm's Python. Dependencies come
   from a file in the repository.
4. **The exact command comes from his README**, typed as written. If you have to guess the
   entry point, improvise a flag, or ask him what to run, the boss is not beaten.
5. **"Runs" means it exits 0 and produces the output his own specification says it produces.**
   Not "no traceback". A program that starts, prints nothing and exits cleanly has not run.

**Record it either way.** A pass goes in the Journal entry for that session, naming the dm's
machine. A failure is a scar — unlimited attempts, failures displayed with pride — and the
scar records **which step** it failed at, because the step is the lesson. Failing at 1, 3 or 4
are three different missing ideas: what a repository contains, what an environment is, and who
your code is actually for.

Three failures worth expecting, each of them a real thing an 11–14-year-old does: a file that
was never `git add`ed and so is not in the clone; an absolute path to a home directory; and a
dependency installed globally months ago and never thought about since.

## Why it cannot be a test

Because it is the one claim the repository cannot make about itself. Every suite here runs on
a machine that already has the code — that is what makes them fast and what makes them blind
to this. "Clones it cold and it runs" is a statement about a *second* machine, and the only
way to check a statement about a second machine is to use one.

The plan calls this the sign-off checklist rather than documentation beside the work, and it
is the win condition of the campaign's load-bearing area: §2.3's diagnosis is graduates who
"cannot ship an original project, having never left the browser sandbox". This is the step
that proves he has.

## When

At the end of Area 2, before Area 3 starts. It is the last thing in the area and it does not
block anything downstream — Area 3 never waited on Area 2 and does not now.
