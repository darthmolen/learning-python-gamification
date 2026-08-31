# Boss - Escape the Sandbox

No scaffolding, no hints, and Socratic questions only (§5.3). Pick one of the framings
offered on the card; the program underneath is the same either way.

**Take something you already built in the browser and make it a real project.** Then push
it. Then I clone it, on my computer, into a folder that has never seen your code, and run
it.

**The win condition is not that the tests pass. The win condition is that your code ran on
somebody else's computer.**

## What it must do

1. **A project directory in your repository**, named by you, containing the rebuilt
   program.
2. **It runs from a file**, from a terminal, in that directory.
3. **`if __name__ == "__main__"`** guarding whatever runs when you run it. You will be
   asked to import your own file and watch what happens with the line and without it.
4. **A `README.md`** with the exact command to run it. Typed as written. Nothing implied.
5. **If it needs anything installed**, a `requirements.txt`, and the README says how.
6. **No absolute paths.** Nothing in your code may mention `C:\Users\<your name>`. That
   path exists on your laptop and nowhere else in the world.
7. **Pushed.** All of it. If you did not push it, it did not happen.

## How it is judged

The dm works five steps, on the dm's machine, with you watching and not touching. The full
checklist is in `curriculum/area-2/dm-guide.md` §7, and it is not a secret — read it before
you start.

1. **A directory that has never seen your code.** Not next to your repository, not a folder
   that once held it.
2. **Cloned by URL, not copied.** Copying a folder proves the code works. Cloning proves
   you pushed it, and that is the half that fails.
3. **A virtual environment built from scratch**, on the dm's Python, from what is in your
   repository.
4. **The exact command comes from your README**, typed as written. If the dm has to guess
   the entry point, improvise a flag, or ask you what to run, **the boss has not been
   beaten.** No hints applies to the run, not only to the writing.
5. **"Runs" means it exits 0 and does what your own README says it does.** Not "no
   traceback". A program that starts, prints nothing and exits cleanly has not run in any
   sense you should be paid for.

## Failing is recorded, and it is recorded properly

Unlimited attempts (§5.3). A failure is a **scar** and it is displayed with pride, and the
scar names **which step** it died on, because the step is the lesson:

| Died at | What was missing |
|---|---|
| 1 | What a repository actually contains, as opposed to what your folder contains |
| 3 | What an environment is, and that your Python is not everybody's Python |
| 4 | Who your code is for. A README is a message to a person who is not you |

## Three things that will kill it, and all three are ordinary

- **A file you never `git add`ed.** It exists. On your laptop. It is not in the clone and
  you cannot fix that from where you are sitting.
- **An absolute path** to a folder that only exists on your machine.
- **Something you installed months ago and have not thought about since.** It works for you
  and not for me, and we are running the same code.

## The tools you need

Everything in Area 2, which is the point of it being the boss:

- `repository` · `git-init` · `git-add` · `git-commit` · `git-log` · `git-branch` ·
  `git-push`
- `files-on-disk` · `running-scripts` · `vscode` · `venv` · `pip` · `tracebacks` ·
  `main-guard`

## Why this one is worth 22

It is the campaign's first quest over DC 20, and the warning on the card is honest. This is
the first task whose failure mode is invisible from where you are standing: it works on
your machine, and that tells you nothing at all.

Everything before this could be checked by you, alone, at your own desk. This one cannot
be. That is the whole of Area 2 and it is why the reward for beating it is the real
toolchain.

## When you are stuck

Read the checklist above and run it on yourself first. Clone your own repository into an
empty folder and try to follow your own README as if you had never seen the project.

The step where you have to remember something that is not written down is the step that is
going to fail.
