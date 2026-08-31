"""Hidden tests for a0-never-closed. Spec §6.3: these never reach the browser.

Broken sigil 3 from session 3, promoted to a fix-it quest. A bracket is never
closed, so Python never gets as far as running anything — the error arrives
before the program starts, which is the thing the session wants noticed.

**Two halves, or the quest teaches the wrong lesson.** `curriculum/area-0/README.md` says it
outright: a fix-it quest that accepted any passing run would accept *"delete the broken
line"*. So these check both — that the SyntaxError is gone, and that the behaviour the broken line
carried is still there. The traceback assertion proves the first; the turtle spy proves the
second.

**No assertion message ever reaches the learner.** The runner passes `--tb=no`
(`apps/runner/src/pyquest_runner/job.py:145-165`) so hidden assertions cannot leak into the
browser, and only pytest's short summary survives — the test's NAME. Every name below is
written as a sentence for that reason. The messages are for whoever is sitting beside him.

`turtle` is stubbed. The runner is `python:3.14-alpine` (§6.6) with neither tkinter nor a
display, so the real module fails at import before an assertion could run.
"""

import pathlib
import runpy
import sys
from collections.abc import Callable
from types import ModuleType
from typing import cast

SUBMISSION = pathlib.Path("solution.py")

# The orders the stub answers to. Anything else raises AttributeError, exactly as the real
# module does. `a0-no-such-order` is a quest ABOUT that refusal, so a stub that said yes to
# every name would pass its broken starter unchanged. The list is generous on purpose: a
# learner who adds a legitimate turtle call must not fail for having done so.
ORDERS = frozenset({
    "forward", "fd", "backward", "back", "bk", "left", "lt", "right", "rt",
    "goto", "setpos", "setposition", "setx", "sety", "setheading", "seth", "home",
    "circle", "dot", "stamp", "undo", "speed",
    "penup", "pu", "up", "pendown", "pd", "down", "pensize", "width", "pen", "isdown",
    "pencolor", "fillcolor", "color", "begin_fill", "end_fill", "filling",
    "reset", "clear", "write", "hideturtle", "ht", "showturtle", "st", "isvisible",
    "shape", "shapesize", "turtlesize", "tilt",
    "position", "pos", "xcor", "ycor", "heading", "distance", "towards",
    "degrees", "radians", "mode", "colormode",
    "getscreen", "getturtle", "getpen", "Turtle", "Screen", "Pen", "RawTurtle",
    "TurtleScreen", "screensize", "setup", "title", "bgcolor", "bgpic",
    "tracer", "update", "delay", "listen", "onkey", "onkeypress", "onclick",
    "onscreenclick", "ontimer", "numinput", "textinput",
    "mainloop", "done", "bye", "exitonclick", "clearscreen", "resetscreen",
    "window_width", "window_height",
})

# Orders whose first argument is a distance or an angle. The real module raises TypeError on
# a str here, and `a0-the-wrong-kind` is a quest about exactly that refusal.
NEEDS_A_NUMBER = frozenset({
    "forward", "fd", "backward", "back", "bk", "left", "lt", "right", "rt",
    "setheading", "seth", "circle",
})


def is_a_number(value: object) -> bool:
    """True for a real int or a real float. `bool` is an `int` and is not a distance."""
    return isinstance(value, (int, float)) and not isinstance(value, bool)


class TurtleSpy:
    """Stands in for `turtle`, recording the orders it is given instead of drawing them."""

    def __init__(self) -> None:
        self.calls: list[tuple[str, tuple[object, ...]]] = []

    def __getattr__(self, name: str) -> Callable[..., "TurtleSpy"]:
        if name not in ORDERS:
            message = f"module 'turtle' has no attribute {name!r}"
            raise AttributeError(message)

        def record(*args: object, **_kwargs: object) -> TurtleSpy:
            if name in NEEDS_A_NUMBER and args and not is_a_number(args[0]):
                message = f"{name}() takes a number, not a {type(args[0]).__name__}"
                raise TypeError(message)
            self.calls.append((name, args))
            return self

        return record

    def given(self, *names: str) -> list[object]:
        """The first argument of every matching call, untouched.

        Untouched is the point. Coercing to float here would let `forward("100")` — the
        whole subject of `a0-the-wrong-kind` — satisfy a comparison against 100.
        """
        return [args[0] for called, args in self.calls if called in names and args]

    def times(self, *names: str) -> int:
        """How many of these orders were given at all."""
        return sum(1 for called, _ in self.calls if called in names)


def attempt() -> tuple[TurtleSpy, Exception | None]:
    """Run the submission with turtle stubbed. Report what it drew and what fell out of it.

    The exception is CAUGHT rather than left to propagate. A test that let it fly would fail
    either way, but it could not say WHICH error is still there — and under `--tb=no` the
    name of the failing test is the entire diagnosis the learner receives.
    """
    spy = TurtleSpy()
    previously = sys.modules.get("turtle")
    sys.modules["turtle"] = cast(ModuleType, spy)
    fell_out: Exception | None = None
    try:
        runpy.run_path(str(SUBMISSION), run_name="__main__")
    # ruff BLE001 objects to the bare `Exception`, and here catching everything IS the
    # assertion: the quest is about whatever fell out, and narrowing the catch would let a
    # brand-new mistake through the check that says nothing may fall out any more.
    except Exception as raised:  # noqa: BLE001
        fell_out = raised
    finally:
        if previously is None:
            del sys.modules["turtle"]
        else:
            sys.modules["turtle"] = previously
    return spy, fell_out


def describe(fell_out: Exception | None) -> str:
    """An exception as its name and message — what the learner sees in their own terminal."""
    return "nothing" if fell_out is None else f"{type(fell_out).__name__}: {fell_out}"


def test_the_bracket_is_closed_and_the_file_compiles_now() -> None:
    """A SyntaxError lands before a single order is given. Nothing drew, and nothing could."""
    _, fell_out = attempt()
    assert not isinstance(fell_out, SyntaxError), (
        f"the file still does not compile — {describe(fell_out)}. Look at the line ABOVE "
        "the one Python points at."
    )


def test_the_program_now_runs_all_the_way_to_the_end() -> None:
    """Whatever else changed, nothing may fall out of it any more."""
    _, fell_out = attempt()
    assert fell_out is None, f"the submission still raises {describe(fell_out)}"


def test_the_first_side_is_still_ordered_the_bracket_was_closed_not_the_line_deleted() -> None:
    """Deleting the unhappy line also makes the file compile. It is not closing the bracket."""
    spy, _ = attempt()
    assert spy.times("forward", "fd") == 2, (
        f"expected two forward orders, found {spy.times('forward', 'fd')} — all three "
        "orders stay, two sides and the corner between them"
    )


def test_both_sides_are_still_one_hundred_steps() -> None:
    spy, _ = attempt()
    assert spy.given("forward", "fd") == [100, 100], (
        f"expected two sides of 100, got {spy.given('forward', 'fd')}"
    )


def test_the_corner_is_still_ninety_degrees() -> None:
    spy, _ = attempt()
    assert spy.given("left", "lt") == [90], (
        f"the turn is {spy.given('left', 'lt')}, and it was 90"
    )

