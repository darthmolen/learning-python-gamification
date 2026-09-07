# Walkthrough 8 — Stop the program and look at it

This is the tool half of practice 8. There is no file to run and nothing for a harness to
check: it is a thing you do in the editor, and the DM watches you do it. That is what makes
`a3-set-a-breakpoint` a `peer-signoff` quest rather than a tested one.

You will need `p8e2_the_key_that_is_not_there.py` open. It crashes on purpose, and it is the
crash you are going to stop inside.

---

## Step 1 — Get the Run and Debug view back

Your editor was stripped down in Area 2 so that nothing on screen was a thing you had not
met. You have now met this one, so you get it back.

Open the Command Palette — **Ctrl+Shift+P** — and type `View: Show Run and Debug`.

A new panel appears on the left. **It is yours now and it does not go away again.**

> **Done when:** you can see a panel with a "Run and Debug" button in it.

---

## Step 2 — Put a breakpoint on the line that fails

Open `p8e2_the_key_that_is_not_there.py`. Find this line:

```python
    total = total + recipe[thing]
```

Click in the narrow strip **to the left of the line number**. A red dot appears.

That dot is a breakpoint. It means *stop here, before running this line*.

> **Done when:** there is a red dot beside that line, and you can make it disappear and come
> back by clicking again.

---

## Step 3 — Run it with the debugger, not with the terminal

In the Run and Debug panel, press **Run and Debug**, then choose **Python File** if it asks.

The program starts, prints its first lines, and **stops on your red dot**. The line is
highlighted. Nothing after it has happened yet.

> **Done when:** the program has paused and one line is highlighted.

---

## Step 4 — Read the Variables panel

Look at the top left. There is a section called **Variables**, and it is showing you every
name that exists at this exact moment.

Find `recipe`. Click the arrow beside it to open it up. **You are looking inside the dict** —
every key and every value, without printing anything.

Now find `thing`. That is what the loop is currently looking up.

> **Done when:** you can say, out loud, what `recipe` holds and what `thing` currently is.

---

## Step 5 — Step round the loop and watch `thing` change

Press **Continue** (the ▶ button, or **F5**). The program runs on until it hits your
breakpoint again — which is the next go round of the loop.

Watch `thing` in the Variables panel. It has changed.

Press Continue again. And again.

**On the third time round, `thing` is `"diamond"`.** Look at `recipe` in the Variables panel
before you press anything. Is `diamond` in there?

Press Continue one more time and the program crashes with the `KeyError` you already met.

> **Done when:** you saw `thing` become `"diamond"`, and you knew the crash was coming before
> it happened.

---

## Step 6 — Say what you just did that `print` could not

This is the step that matters and it is a conversation, not a click.

You could have found this bug with `print`. People do, every day. So what was different?

- You saw **everything** at that moment, not just the things you thought to print.
- You saw it **without editing the program**. No print lines to add and delete afterwards.
- You could look at `recipe` *and* `thing` *and* `total` at the same instant, and compare
  them.

And what `print` still does better:

- A `print` that stays in the program tells you something **every single time it runs**. A
  breakpoint only tells you something while you are standing there watching.

> **Done when:** you can name one thing a breakpoint does better and one thing `print` does
> better.

---

## What is not in this walkthrough, and when you get it

There is a feature that stops your program **at the exact moment any error is raised**,
without you having to know which line to put the dot on. It is the best single debugging
feature there is for the kind of bugs this area produces.

You do not get it yet. It arrives in Area 7 with the rest of the deep debugger — conditional
breakpoints, logpoints, and the call stack — and it will be worth the wait.

Tonight you learned where to stand and how to look. That is enough to find most things.
