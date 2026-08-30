"""A turtle that records instead of drawing.

Pyodide has no screen, so the real ``turtle`` module cannot run: it wants tkinter. This stands
in for it, and it does exactly one thing — appends a record per call. Every piece of arithmetic
lives in ``protocol.ts`` on the other side, where it can be tested without a browser.

That split is deliberate. The part most likely to be wrong is the geometry, and this way the
geometry is a pure function over a list rather than something only observable as pixels.

Two properties this file must keep:

* **Nothing here raises.** A learner's first program ends in ``done()``; if that failed, his
  program would break on its last line for a reason he could not diagnose.
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


def forward(distance: float) -> None:
    _record("forward", distance)


def backward(distance: float) -> None:
    _record("backward", distance)


def right(angle: float) -> None:
    _record("right", angle)


def left(angle: float) -> None:
    _record("left", angle)


def goto(x: float, y: float) -> None:
    _record("goto", x, y)


def setheading(angle: float) -> None:
    _record("setheading", angle)


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
    _record("circle", radius)


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
