# git

**Both machines. Needed week 6, Area 2a session 1.**

The client only. *Where he pushes to* is a separate decision — see below — and Area 2a is
written so the session runs whichever way that decision goes.

## Install

[git-scm.com](https://git-scm.com/downloads). On Windows this brings **Git Bash**, which is
the shell this repository's commands assume.

```
git --version
```

## Configure before session 1, not during

Two settings, done ahead of time, because a first commit that stops to ask for an identity
is a bad first commit:

```
git config --global user.name  "<his name>"
git config --global user.email "<his email>"
```

**If his repository will live on GitHub**, use the noreply address rather than a real one —
`<id>+<username>@users.noreply.github.com`. GitHub's default account setting blocks pushes
that would expose a private email, and the rejection (`GH007`) arrives at the worst possible
moment: after he has written the code, made the commit, and expects it to land.

**No hooks, no CI, no linter on his repository.** §7 is explicit: *a first `git commit`
rejected by a linter he did not install and cannot read is a bad first day.* Green
checkmarks on his own commits are a roadmap item, not a week-6 one.

## The remote is a decision, not an install

He needs *a* remote to learn `push`. In order of preference:

1. **Gitea on the parent's machine.** The intended answer, and the one that makes the game
   notice — §6.4 makes push the verification mechanism. Needs
   `planning/backlog/feature_gitea-lan-access-for-the-son_2026-08-27.md` resolved first:
   `GITEA_DOMAIN` is still `localhost`, so advertised clone URLs are wrong off-host, and
   3080/3022 are closed on the firewall.
2. **A bare repository on a USB stick or a LAN share.** Teaches `push` identically.
3. **A second directory on his own laptop.** Also teaches `push` identically.

All three teach the same commands. The third is a compromise on the drama, not the teaching
— **but it is illegal for Boss 2**, which needs his code to reach a genuinely different
machine. `curriculum/area-2/dm-guide.md` carries the commands for each.

## What proves it works

```
git --version
git config --global user.name && git config --global user.email
```

Then, before session 4: a `git push` to whichever remote was chosen, from his machine,
completing without a credential prompt he cannot answer.
