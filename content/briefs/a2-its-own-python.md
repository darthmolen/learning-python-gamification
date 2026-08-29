# Its Own Python

Your laptop has more than one Python on it. So does mine. This quest is about a project
that stops caring which one you happen to be standing in.

## What it must do

At the top of your repository:

```
its-own-python/
    main.py
    requirements.txt
    README.md
```

1. **A virtual environment**, built inside `its-own-python/` and **never committed**. Your
   repository's `.gitignore` keeps it out.
2. **`requirements.txt`** naming at least one thing you installed with `pip`. One line is
   enough.
3. **`main.py`** that actually imports and uses it. If your program would run identically
   without the thing you installed, you have not needed a venv yet — pick something that
   does something.
4. **`README.md`** with the exact commands, in order, that turn a fresh clone into a
   running program: create the environment, activate it, install from `requirements.txt`,
   run the program.

## When you are done

Delete `.venv` entirely. Then rebuild it from your own README, typing only what is written
there, and run the program again.

If you had to remember anything that was not in the README, the README is not finished —
and that is the exact way Boss 2 fails two sessions from now.

## What is checked, and what a person has to watch

Machines can check that you declared the environment and did not commit it. They cannot
watch you activate it and see the prompt change, or watch you find out which Python is
running. That half is the dm's, on the night.

The two things that actually go wrong with virtual environments are **committing the whole
directory** and **having no record of what was installed**. Both of those are in the list
above.

## The tools you need

- `venv`
- `pip`
- `running-scripts`

## When you are stuck

"It works for me and not for you, and we are running the same code." So what is different?

There is a way to make Python tell you exactly which interpreter is running rather than
which one you meant. Find it, and then use it every single time this confuses you for the
rest of your life.
