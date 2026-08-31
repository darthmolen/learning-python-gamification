# The Log As A Story

A repository nobody can read is a pile of saves. This one has to read as a story, and
somebody else has to be able to follow it.

## What it must do

1. **At least five commits**, and every message passes one test: *could I find this commit
   again by reading only the list?*
2. **One branch**, made on purpose, with at least one commit on it.
3. **One merge**, bringing it back.
4. `git log --oneline --graph --all` shows the fork and the join.
5. **You read the log out loud to the dm**, oldest first, and say what each commit did.

## When you are done

The dm has heard the story, from your log, without opening a single file. That is the
whole win condition and it is why this one is signed off by a person.

## Why a person signs this off

A signal can prove commits exist. It cannot prove they read as a story, and the story is
the entire concept. Nothing automated is going to tell you that `stuff2` was a bad
message; only November is, and November is too late.

## The tools you need

- `git-log`
- `git-branch`
- `git-commit`

## Branches, lightly

One branch, one merge, read the log, done. Rebasing, pull requests and rewriting history
are real and they are Area 7. "Not yet" is the answer, and there is a reason for the
order.

## When you are stuck

`git log` opens in a pager. Press `q`. Then use `git log --oneline`, which is what you
will use for the rest of your life.

If you switch branches and your work appears to vanish: nothing is lost. Ask yourself
where it went before you ask anyone else.
