# It Is Somewhere Else

Everything you have made in three sessions exists in one place, on one laptop, in one
folder. Tonight that stops being true.

## What it must do

1. **A remote**, added as `origin`. The dm has picked which one — a Gitea address, a bare
   repository on a stick, or a folder on this laptop pretending to be a server. All three
   work identically.
2. **A successful `git push -u origin main`.**
3. **Proof.** Clone your own repository into an empty directory somewhere else, and run
   one of your files out of it.
4. **A second push**, after committing something new, with plain `git push`.
5. **One thing that did not make it into the clone, found and explained.** There will be
   one. Say whether `.gitignore` was doing its job or whether you forgot to `git add` it.

## When you are done

There are two complete copies of your work and you made the second one out of nothing but
an address.

Then delete the clone. On purpose. You destroyed a full copy of everything you own and
lost nothing, and that is worth feeling strange about for a minute.

## Why step 5 matters more than it looks

*A file that was never `git add`ed is not in the clone.* That is how Boss 2 fails, four
sessions from now, on somebody else's machine, in front of you, with nothing you can do
about it from where you are sitting.

Finding it tonight costs you thirty seconds.

## The tools you need

- `git-push`
- `repository`

## When you are stuck

`git push` sends **commits**. If you edited a file and did not commit it, push has nothing
to send and will tell you everything is up to date — which is true, and not what you
meant.

If the error names `origin`, ask yourself whether you have ever told git what origin is.

**If it is an authentication or network failure, that one is not yours.** Say so, and use
whichever remote works tonight.
