"""A turtle that records instead of drawing.

Pyodide has no screen, so the real ``turtle`` module cannot run: it wants tkinter. This stands
in for it, and it does exactly one thing — appends a record per call. Every piece of arithmetic
lives in ``protocol.ts`` on the other side, where it can be tested without a browser.

That split is deliberate. The part most likely to be wrong is the geometry, and this way the
geometry is a pure function over a list rather than something only observable as pixels.

Three properties this file must keep:

* **No cosmetic call raises.** A learner's first program ends in ``done()``; if that failed, his
  program would break on its last line for a reason he could not diagnose. The same goes for
  ``shape()``, ``speed()`` and ``exitonclick()`` — a program dying on decoration is a bad trade.
* **Every arithmetic call raises exactly what CPython raises, in one frame.** This is the other
  half of the same rule and it was missing, which broke the Area 0 quest that depends on it most:
  ``forward("100")`` recorded a string, drew nothing, and reported no error at all. See the note
  above :func:`forward`.
* **Ops survive an exception.** ``_OPS`` is module state, so a program that raises halfway
  through still leaves behind everything it drew before it failed — which is what he needs to
  see in order to debug it.
"""

from __future__ import annotations

Arg = float | str
Op = dict[str, str | list[Arg]]

_OPS: list[Op] = []


def _record(op: str, *args: Arg) -> None:
    _OPS.append({"op": op, "args": list(args)})


def _drain() -> list[Op]:
    """Hand the recorded ops to the host and start clean. Called by the worker, not by learners."""
    ops = list(_OPS)
    _OPS.clear()
    return ops


# The `* 1.0` on every line below is the type check, and it is written inline rather than
# pulled into a helper because **the learner reads these lines in a traceback.**
#
# `input()` hands back a `str`, and passing that straight to `forward()` is the mistake Area 0
# session 5 is built around. On his own machine CPython's turtle reaches `Vec2D.__mul__`,
# multiplies a float by his string, and says:
#
#     TypeError: can't multiply sequence by non-int of type 'float'
#
# Doing the same multiplication here gets him the same sentence from the same interpreter,
# rather than a message this repository invented for an error Python already has words for --
# and Area 2 moves his file to a real Python, where the invented one would not be there.
#
# A `_number()` helper did this first and cost a frame: the traceback ended on
# `return 1.0 * value` inside a private function, which reads as a trick played on him rather
# than as work his program asked for. One frame, and it names the parameter he passed.
def forward(distance: float) -> None:
    _record("forward", distance * 1.0)


def backward(distance: float) -> None:
    _record("backward", distance * 1.0)


def right(angle: float) -> None:
    _record("right", angle * 1.0)


def left(angle: float) -> None:
    _record("left", angle * 1.0)


def goto(x: float, y: float) -> None:
    _record("goto", x * 1.0, y * 1.0)


def setheading(angle: float) -> None:
    _record("setheading", angle * 1.0)


def home() -> None:
    _record("home")


def penup() -> None:
    _record("penup")


def pendown() -> None:
    _record("pendown")


def pensize(width: float) -> None:
    _record("pensize", width)


def pencolor(color: str) -> None:
    _record("pencolor", color)


def circle(radius: float) -> None:
    _record("circle", radius * 1.0)


def speed(value: float | str = 0) -> None:
    """Accepted and ignored. There is no animation to pace; the drawing arrives at once."""
    _record("speed", value)


def done() -> None:
    """Accepted and ignored. Every turtle tutorial ends with this line."""
    _record("done")


def exitonclick() -> None:
    """Accepted and ignored, for the same reason as :func:`done`."""
    _record("exitonclick")


def shape(name: str) -> None:
    """Choose what the turtle looks like.

    Python ships ``classic`` (the arrow you start with) and ``turtle`` (an actual turtle). This
    shim adds ``dragon``. A name it does not know leaves the current shape alone rather than
    raising — real turtle raises, and a program dying on a cosmetic line is a bad trade.
    """
    _record("shape", name)


def register_shape(name: str, polygon: object = None) -> None:
    """Real turtle API, recorded and currently ignored.

    ``register_shape("mine", ((0, 16), (-8, -8), (8, -8)))`` is how a custom shape is made in
    ordinary Python, on any machine. The shim does not build one yet, so this is a no-op that
    keeps the call legal — see the quest in ``planning/backlog/``.
    """
    _record("register_shape", name)


def hideturtle() -> None:
    _record("hideturtle")


def showturtle() -> None:
    _record("showturtle")


# Short aliases the tutorials use interchangeably with the long names.
fd = forward
bk = backward
back = backward
rt = right
lt = left
pu = penup
pd = pendown
up = penup
down = pendown
seth = setheading
setpos = goto
setposition = goto
width = pensize
color = pencolor
