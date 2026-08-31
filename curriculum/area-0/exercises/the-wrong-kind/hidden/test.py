"""Hidden tests for a0-the-wrong-kind. Spec §6.3: these never reach the browser.

Broken sigil 2 from session 3, promoted to a fix-it quest. The starter says
`turtle.forward("100")`, and a turtle cannot walk a piece of text.

The stub reproduces that refusal rather than accepting the str quietly — see
`NEEDS_A_NUMBER` below. A yes-man stub would pass the broken starter untouched.

**Two halves, or the quest teaches the wrong lesson.** `curriculum/area-0/README.md` says it
outright: a fix-it quest that accepted any passing run would accept *"delete the broken
line"*. So these check both — that the TypeError is gone, and that the behavior the broken line
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


def test_forward_no_longer_raises_a_type_error() -> None:
    """A TypeError is Python objecting to the KIND of thing, not to its name or its value."""
    _, fell_out = attempt()
    assert not isinstance(fell_out, TypeError), (
        f"still a TypeError — {describe(fell_out)}. The quotation marks are the problem: "
        "they make 100 a piece of text, and the turtle needs a number."
    )


def test_the_program_now_runs_all_the_way_to_the_end() -> None:
    """Whatever else changed, nothing may fall out of it any more."""
    _, fell_out = attempt()
    assert fell_out is None, f"the submission still raises {describe(fell_out)}"


def test_the_line_is_still_drawn_the_order_was_fixed_not_deleted() -> None:
    """A program that draws nothing raises nothing either. That is not an achievement."""
    spy, _ = attempt()
    assert spy.times("forward", "fd") == 1, (
        "the turtle never moved. Deleting the order removes the error and the drawing "
        "together — fix the order instead."
    )


def test_forward_was_given_a_number_not_text_that_looks_like_one() -> None:
    """Asserting on the value alone would miss this: "100" and 100 float to the same thing."""
    spy, _ = attempt()
    given = spy.given("forward", "fd")
    assert given, "forward() was never called"
    assert is_a_number(given[0]), (
        f"forward() got {given[0]!r}, a {type(given[0]).__name__} — take the quotation "
        "marks off it, or convert it"
    )


def test_it_is_still_one_hundred_steps() -> None:
    spy, _ = attempt()
    assert spy.given("forward", "fd") == [100], (
        f"expected one side of 100, got {spy.given('forward', 'fd')}"
    )

