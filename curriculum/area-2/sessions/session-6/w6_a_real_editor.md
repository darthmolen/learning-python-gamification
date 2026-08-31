# Walkthrough 6 — A Real Editor

**Concepts:** `vscode` · resurfaces `files-on-disk`, `running-scripts`
**DC:** 10
**You need:** VS Code, the `PyQuest` profile already imported (the DM does this; see
`tools/vscode/README.md`), your repository, and `the_dot_on_the_tab.py` from this
directory.

Notepad has been enough for six weeks and it is about to stop being enough. Tonight you
get a real editor — with most of it turned off.

---

## Before you start

Out loud, no looking:

1. What has to be true about where you are standing for `py -3.14 thing.py` to work?
2. What is the difference between the REPL and a file?
3. Name two ways to find out which directory you are in.

---

## 1. Open a folder, not a file

This is the first thing and almost everybody gets it wrong.

**File → Open Folder**, and pick **your repository** — the whole thing, not one file
inside it.

A list appears down the left. That is every file you own, and you have never seen them
all in one place before.

**VS Code with a single file open is a worse Notepad.** With a folder open it knows where
you are, which is the entire difference and the only reason you are using it.

---

## 2. Notice what is not there

Compare it to a screenshot of VS Code from the internet, or to the DM's copy.

Missing: the strip of icons down the left edge, the little map on the right, the bar of
breadcrumbs above the file, the blue bar along the bottom, the row of tabs, the outline,
the problems panel, the source control panel, the testing panel, the extensions panel.

**All of it was removed on purpose and none of it is lost.** Every one comes back later,
one at a time, when there is something you actually need it for. The list of which ones
and when is in `tools/vscode/README.md` and you are allowed to read it.

**Write down the one you most want back and what you would use it for.** That sentence is
how you get it.

And know the way out, because a tool you cannot leave is not a tool:

```
Ctrl+Shift+P  →  Profiles: Switch Profile  →  Default
```

That gives you a normal, noisy VS Code in one second. Switching back gives you this one.

---

## 3. The terminal is inside it now

```
Ctrl+`
```

(That is the key above Tab, on the left, with the squiggle on it.)

A terminal opens along the bottom. Before you type anything else:

```
pwd
```

**It opened in the folder you opened, not in the folder of the file you are looking at.**
Those are different things whenever your file is in a subdirectory, and this is the
number two way to lose ten minutes tonight.

```
cd editor-practice
```

— once that folder exists, which it does not yet. Make it:

```
mkdir editor-practice
cd editor-practice
```

Copy `the_dot_on_the_tab.py` into it. It appears in the list on the left the moment it
lands, without you asking.

---

## 4. The number one way to lose ten minutes

Do these five steps in order. **Do not save until step 4.** The order is the whole
lesson.

1. Run it:

   ```
   py -3.14 the_dot_on_the_tab.py
   ```

   It says version 1.

2. In the editor, change `version = 1` to `version = 2`. **Do not save.** Look at the top
   of the editor, where the file's name is. Something small has appeared next to it.

3. Run the exact same command again.

   **It still says version 1.**

   Nothing is broken. There are two copies of this file: the one on your screen, and the
   one on the disk. **Python cannot see the one on your screen.** It never could.

4. Save it — `Ctrl+S` — and watch the mark go.

5. Run it again. Version 2.

> The mark means: what you are looking at is not what is on the disk.

You will lose ten minutes to this anyway, at some point, probably twice. The mark is how
you get those ten minutes back.

**Auto-save is off on purpose**, and it stays off. An editor that quietly saved for you
would have removed this lesson along with the problem.

---

## 5. The Run button, and why you are not using it

There is a play button, or there is `F5`. Try it once.

Then run the same file from the terminal.

Both worked. Now answer this: **which Python did the button use?** The terminal command
says `py -3.14` in front of your eyes, every time, and you typed it. The button used
whatever it decided to use and did not tell you.

Next session is entirely about that question, so tonight the ruling is simple: **run from
the terminal.** The button is not forbidden and it is not the tool for a person who is
still learning which Python is which.

---

## 6. Do real work in it

Open the files you wrote in session 5 — `where-the-file-lives/run_me.py`, `NOTES.md` —
and improve one of them in the editor. Anything: a better sentence, an extra print.

Then, in the terminal at the bottom of the same window:

```
git status
git add .
git commit -m "..."
git push
```

**The editor has no git buttons and that is deliberate.** You learned the commands first,
for four sessions, and the buttons come back in Area 7 as a convenience rather than as a
crutch. There is a difference and you will be able to feel it.

---

## Say it in your own words

> "The mark next to the file's name means ________."
>
> "VS Code with a folder open knows ________, and with one file open it knows ________."

---

## Done when

- [ ] You opened a **folder**, not a file
- [ ] You can name three things a normal VS Code has that this one does not
- [ ] You know the command that gives you a normal VS Code back
- [ ] The terminal is open inside the editor and you checked what directory it started in
- [ ] You ran a stale file on purpose and understood why it was stale
- [ ] You committed and pushed from the terminal inside the editor
- [ ] You wrote down which hidden panel you want back, and what for
