# Session 3 — the seven sigils, answered

**Read this before session 3, not during it.** You need to know what is coming so you
can stay quiet while he finds it. If you are reading this in front of him, you have
already given it away.

Every message below was captured by running the file on Python 3.14.6 on Windows. If
you get something materially different, the Python version differs — check
`py -3.14 --version` before assuming the exercise is broken.

---

## b1 — `b1_the_typo.py`

```
Traceback (most recent call last):
  File "...\b1_the_typo.py", line 17, in <module>
    turtel.left(90)
    ^^^^^^
NameError: name 'turtel' is not defined. Did you mean: 'turtle'?
```

**Broken:** `turtel` on line 17.
**Teaches:** the four parts of a traceback. Python even offers the fix, and it is worth
saying out loud that the suggestion is a *guess* based on spelling — it has no idea what
he meant.
**Window opens?** Yes, and it draws the first line before dying. Worth noticing.

## b2 — `b2_wrong_kind.py`

```
Traceback (most recent call last):
  File "...\b2_wrong_kind.py", line 16, in <module>
    turtle.forward("100")
    ~~~~~~~~~~~~~~^^^^^^^
  File "<string>", line 8, in forward
  File "...\Lib\turtle.py", line 1705, in forward
    self._go(distance)
  File "...\Lib\turtle.py", line 1665, in _go
    ende = self._position + self._orient * distance
  File "...\Lib\turtle.py", line 254, in __mul__
    return Vec2D(self[0]*other, self[1]*other)
TypeError: can't multiply sequence by non-int of type 'float'
```

**Broken:** `"100"` is text; `forward` needs a number.
**Teaches:** the most important reading skill in the tier. Five frames, and he wrote
exactly one of them. The message is about multiplying sequences, which relates to
nothing he did — it is Python narrating its own insides.

The question to ask, and the only one: **"which of those files did you write?"**

Do not try to explain "can't multiply sequence by non-int". You could, and it would cost
you ten minutes and teach him that tracebacks require an adult to interpret. The skill
is finding his own line, not decoding library internals.

## b3 — `b3_never_closed.py`

```
  File "...\b3_never_closed.py", line 20
    turtle.forward(100
                  ^
SyntaxError: '(' was never closed
```

**Broken:** missing `)` on line 20.
**Teaches:** this is a *different kind* of error, and the two tells are visible.

- **No window opens at all.** Not for a moment.
- **No "Traceback" line**, and no frames.

Both because nothing ran. Python reads the whole file before executing any of it, and it
could not finish reading. Contrast with b1, which got to line 17 and drew a line first.

Note the caret points at the **opening** bracket — Python shows the thing that was never
finished, not the place it noticed. Note also that line 20 really is the wrong line;
3.14 is genuinely good at this, where older Pythons and most other languages blame the
line after.

## b4 — `b4_out_of_line.py`

```
  File "...\b4_out_of_line.py", line 16
    turtle.left(90)
IndentationError: unexpected indent
```

**Broken:** four spaces before `turtle.left(90)`.
**Teaches:** the same class as b3 — no traceback, no window, nothing ran. Also that
leading whitespace is syntax in Python, which surprises people arriving from almost
anywhere else. He has met indentation in Scratch as the shape of the blocks, which is a
genuinely useful comparison if he raises it.

## b5 — `b5_no_such_order.py`

```
Traceback (most recent call last):
  File "...\b5_no_such_order.py", line 17, in <module>
    turtle.forwrd(100)
    ^^^^^^^^^^^^^
AttributeError: module 'turtle' has no attribute 'forwrd'. Did you mean: 'forward'?
```

**Broken:** `forwrd` on line 17.
**Teaches:** the distinction from b1, which is the point of having both.

In b1, Python had never heard of `turtel` at all — a wrong **noun**. In b5, Python knows
exactly what `turtle` is and is being asked for something it does not have — a wrong
**verb**.

Do not accept "they're basically the same". Ask: **"in which one does Python know what
`turtle` is?"**

## b6 — `b6_not_a_number.py`

```
Traceback (most recent call last):
  File "...\b6_not_a_number.py", line 15, in <module>
    size = int("ten")
ValueError: invalid literal for int() with base 10: 'ten'
```

**Broken:** `"ten"` is a number in English, not in digits.
**Teaches:** the right *kind* of thing with the wrong *value* in it — the difference
between `TypeError` and `ValueError`, which he will re-meet for real in session 5 when a
user types "big" at his prompt.

"literal" and "base 10" are jargon. If he asks, "base 10" means ordinary digits. Do not
volunteer it.

## b7 — `b7_no_error_at_all.py`

**No error. Exit code 0. Prints "Four sides, four turns. Square finished."**

**Broken:** `turtle.left(80)` four times instead of `left(90)`. It draws a lopsided
open shape.

**This is the point of the session, so protect it.** Let him run it, see no red text,
and declare it working. Then:

> "Python is happy. Are you happy? Look at the picture."

And then the line the whole session exists for:

> **"Errors are the easy failures. They come with a name, a line number and an arrow.
> The ones that don't tell you anything are the ones that cost real money."**

If you want one concrete story here, tell him about a real silent bug you shipped. He
will remember the story and forget the sentence.

---

## The written questions in `error-log.md`

1. **Which two had no "Traceback"?** b3 and b4. Both are errors in *reading* the file,
   before anything ran.
2. **Which opened no window?** b3 (and b4). Because nothing executed at all.
3. **b1 vs b5 — where does Python know `turtle`?** b5.
4. **b2's files — how many did he write?** One. Line 16. That is where to look.
5. **Was b7 correct?** No. It ran perfectly and drew the wrong thing.
6. **Hardest to find unaided?** b7, and it is not close. Every other one announces
   itself with a name and a line number. b7 requires somebody to look at the result and
   care whether it is right.

---

## The reversal, at the end

He plants three bugs in a working file and you find them.

**Get one wrong on purpose is the wrong instruction — get one wrong for real.** Do not
pre-read his file. Work through it out loud, guess a line, be wrong, say "huh, no,
that's fine", and go back.

Spec §5.8 calls this the highest-value mechanic in the design, on the grounds that a
child who has never seen a competent adult get stuck concludes that being stuck means
being stupid. It only works if the failing is genuine. If you happen to find all three
in ten seconds, say which was hardest and why, and never make it look free.
