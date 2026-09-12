---
audience: learner
---

# Set A Breakpoint

Every bug you have found this year, you found by adding `print` lines and taking them out
again. This quest is the other way to look.

**Nobody tests this one.** Somebody watches you do it. That is not a softer bar — a test can
check that a program ran, and it cannot check that you knew where to stand.

## What you have to show

Open `practices/practice-8/p8e2_the_key_that_is_not_there.py`. It crashes on purpose, with a
`KeyError` that tells you almost nothing: the key it could not find, and then it stops.

With the DM watching, do all five:

1. **Get the Run and Debug view back.** Ctrl+Shift+P, then `View: Show Run and Debug`. It
   was hidden in Area 2 because you had not met it. You have now.
2. **Put a breakpoint on the line that fails** — the red dot, in the strip left of the line
   number.
3. **Run it with the debugger** and stop on that line, with nothing after it having happened.
4. **Read the Variables panel out loud.** What is in `recipe`, and what is `thing` right now.
5. **Step round the loop** until `thing` is the key that is not there — and say, before you
   press again, that the next step is the crash.

Step 5 is the quest. Everything before it is setup.

## What the DM is listening for

Not the clicks. One sentence, in your own words, about **what you could see that a `print`
would not have told you.**

There is a good answer and it is worth arriving at yourself. A hint at the shape of it: you
did not have to decide in advance what to look at.

And the other half, which is just as much part of passing: **name one thing `print` still
does better.** If you cannot, you have been sold something.

## When you are done

You can stop a program on a line you chose, look at everything alive at that moment, and
carry on. That is the whole tool. It does not get more complicated for four more areas.

## The tools you need

- `breakpoints`
- `dict`
- `vscode`

## What this is not

**This is not the debugger.** There is a feature that stops your program the instant *any*
error is raised, without you knowing which line to mark — and for the bugs this area
produces it is the best thing in the editor.

You do not get it yet. It arrives in Area 7 with conditional breakpoints, logpoints and the
call stack, and it will be worth the wait. Tonight is where to stand and how to look, which
is enough to find most things.

## When you are stuck

If the red dot will not appear, you are clicking the wrong strip — it is left of the number,
not on it.

If the program runs straight past your breakpoint: did you press **Run and Debug**, or did
you run it in the terminal the way you always have? Only one of those is watching.
