# The First Commit

Your journal has been sitting in a folder since week one. Tonight it stops being a folder
and starts being history.

## What it must do

1. **A repository of your own, that you named.** Not one I named. `git init` it in the
   folder your code already lives in.
2. **Your journal entries, inside it**, in a directory called `journal`. Copy them; leave
   the originals where they are.
3. **One commit containing them**, with a message you wrote.
4. **A second, separate commit** containing one file of code. Separate on purpose — this
   is what the staging area is for.
5. **A `.gitignore`**, committed, that keeps out things you did not write.

## When you are done

`git status` says **nothing to commit, working tree clean**, and `git log --oneline` shows
at least three lines.

## The question this quest is really asking

Why are `add` and `commit` two commands, when every other program on this laptop has one
Save button?

If your answer is "no reason, it's just how git is", you have not got it yet. Change two
files, finish one of them and leave the other one a mess, and then ask again which ones
you want in the save.

## The tools you need

- `repository`
- `git-init`
- `git-add`
- `git-commit`

## When you are stuck

Read what git said to you. All of it, including the paragraph at the bottom. Git's error
messages contain the next command more often than not, and reading them is half of this
area.
