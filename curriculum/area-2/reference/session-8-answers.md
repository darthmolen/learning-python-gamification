# Session 8 — the stack, answered

**Read this before session 8, not during it.** You need to know what is coming so you
can stay quiet while he finds it. If you are reading this in front of him, you have
already given it away.

Every traceback below was captured by running the file on **Python 3.14.6, Windows 11**.
Paths are shortened to `...\`; on the night they will be absolute and long, and the
length is part of what makes him panic. If you get something materially different, check
`py -3.14 --version` before assuming an exercise is broken.

This is the **third pass** at reading errors (§3 principle 7). Area 0 session 3 was
`reading-errors` in tiny one-frame files. Area 1 session 6 was the same skill against
loops. Tonight the object is genuinely different: the code is in files with names, the
files import each other, and **a stack has more than one frame in it for the first
time.**

---

## The chain — `bottom_frame.py`, `middle_frame.py`, `top_frame.py`

Three files, one mistake, three distances from it. Run them in that order.

### `bottom_frame.py` — one frame

```
bottom_frame is about to do something silly.
Traceback (most recent call last):
  File "...\bottom_frame.py", line 18, in <module>
    sides = int("four")
ValueError: invalid literal for int() with base 10: 'four'
```

**Broken:** `int("four")`. Four is a number in English, not in digits.
**Teaches:** the shape he already knows, on purpose, as the baseline for the next two.
This is Area 0's b6 exactly, one area later, so he should recognise it — and if he does
not, that is worth knowing before the boss.

### `middle_frame.py` — two frames

```
bottom_frame is about to do something silly.
Traceback (most recent call last):
  File "...\middle_frame.py", line 13, in <module>
    import bottom_frame
  File "...\bottom_frame.py", line 18, in <module>
    sides = int("four")
ValueError: invalid literal for int() with base 10: 'four'
```

**Broken:** still `bottom_frame.py` line 18. `middle_frame.py` contains no mistake at
all and is named anyway.
**Teaches:** a frame is not an accusation. It is a step in the story of how Python
arrived at the mistake.

The question, and it is the good one: **"which of these two files is wrong?"** He will
say `middle_frame`, because it is first. It is first because it is the outermost, and the
outermost is the furthest from the problem.

**Also worth noticing:** the only line printed before the traceback came out of
`bottom_frame`, which he did not run. That is the import doing its job — it runs the
whole of the other file — and it is the same fact that `banner.py` is about.

### `top_frame.py` — three frames

```
bottom_frame is about to do something silly.
Traceback (most recent call last):
  File "...\top_frame.py", line 15, in <module>
    import middle_frame
  File "...\middle_frame.py", line 13, in <module>
    import bottom_frame
  File "...\bottom_frame.py", line 18, in <module>
    sides = int("four")
ValueError: invalid literal for int() with base 10: 'four'
```

**Teaches:** the last line is identical in all three runs. **The error never moved.** The
only thing that changed is how far away from it he was standing.

If he takes one sentence out of this session it is that one, and the way to get it is to
put the three tracebacks side by side on the screen rather than to say it.

**The fix is one word in one file, and it is not the file he ran.** Ask him afterwards
which file he had to open. That question is the session.

---

## `the_library_floor.py` — four frames, and he wrote one

```
Reading some settings that a mod might have written...
Traceback (most recent call last):
  File "...\the_library_floor.py", line 19, in <module>
    settings = json.loads('{"blocks": 3, "name": "quarry"')
  File "...\Lib\json\__init__.py", line 352, in loads
    return _default_decoder.decode(s)
           ~~~~~~~~~~~~~~~~~~~~~~~^^^
  File "...\Lib\json\decoder.py", line 345, in decode
    obj, end = self.raw_decode(s, idx=_w(s, 0).end())
               ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^
  File "...\Lib\json\decoder.py", line 361, in raw_decode
    obj, end = self.scan_once(s, idx)
               ~~~~~~~~~~~~~~^^^^^^^^
json.decoder.JSONDecodeError: Expecting ',' delimiter: line 1 column 31 (char 30)
```

**Broken:** the closing brace is missing from the settings text on line 19.
**Teaches:** the other shape, and the one that causes the panic. Four frames, and he
wrote exactly one of them.

**Ask the one question and no others:** *"which of those files did you write?"*

**Do not explain `raw_decode`, `scan_once` or `_default_decoder`.** You could, and it
would cost you ten minutes and teach him that tracebacks need an adult to interpret.
This is the same ruling as Area 0's b2 with the turtle, and it holds for the same reason:
the skill is finding his own line, not decoding somebody else's insides.

Two details worth pointing at, briefly:

- **The error name has dots in it** — `json.decoder.JSONDecodeError`. That is a name with
  an address on the front, and the address says which library it came from. He does not
  need more than that tonight.
- **`line 1 column 31`** is a position inside the *settings text*, not inside his file.
  Two different kinds of line number in one traceback. If he spots that unprompted it is
  the best thing he will do all evening.

---

## `banner.py` and `show_the_banner.py` — the main-guard

Run directly, `banner.py` prints:

```
===========================
AREA 2 - ESCAPE THE SANDBOX
===========================
banner.py was RUN.
```

Run `show_the_banner.py`, which imports it:

```
show_the_banner is running.
I imported banner.py and borrowed its title: AREA 2 - ESCAPE THE SANDBOX
Notice what did NOT happen: banner.py did not print its own banner.
```

**Teaches:** `if __name__ == "__main__":` is not decoration and it is not a spell. It is
a comparison he can already read, against a variable Python fills in, which holds one of
exactly two things:

- the text `"__main__"`, when this is the file being run;
- the file's own name, when somebody imported it.

### The demonstration that lands, and it must be done in this order

1. Run `show_the_banner.py`. No banner. The title is still available.
2. **Delete the `if` line in `banner.py` and un-indent the prints under it.**
3. Run `show_the_banner.py` again. **The banner prints when nobody asked for it.**
4. Put it back.

Step 3 is the whole lesson and it takes eleven seconds. Skipping to the explanation is
the temptation, and it produces a rule he obeys without understanding, which is the thing
this curriculum is against.

**If he asks why anyone would import his file** — a fair question tonight — the honest
answer is "you will, in about six weeks, and Boss 2 asks you to have the line in place
before you need it." Do not oversell it.

---

## The written questions

The walkthrough asks him to write these down. The answers:

1. **How many frames in `top_frame.py`'s traceback?** Three, and he wrote all three
   files.
2. **How many in `the_library_floor.py`'s?** Four, and he wrote one.
3. **Which line of any traceback says what went wrong?** The last one.
4. **Which line says where?** The frame directly above it.
5. **Which file did you fix, and which did you run?** `bottom_frame.py`, and
   `top_frame.py`. They are not the same file, and that is the point of the exercise.
6. **What does `__name__` hold?** `"__main__"` when the file is run, the file's own name
   when it is imported.

---

## Where the boss uses this, one session from now

Both halves of tonight show up in Boss 2, and it is worth saying so at the end:

- **The traceback half** is what he will be reading when the cold clone fails on your
  machine, at speed, with somebody watching. That is the worst possible moment to be
  learning to read one.
- **The main-guard half** is item 3 on the boss brief. He will be asked to import his own
  project file and watch what happens with the guard and without it.

Say that out loud in beat 5, and then say the other true thing: **the next session is the
boss.**
