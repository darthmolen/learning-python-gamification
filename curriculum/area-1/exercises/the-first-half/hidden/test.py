"""Hidden tests for a1-the-first-half. Spec §6.3: these never reach the browser.

Every Area 1 quest draws, and §6.3's rule is that a test asserts on a **computed value,
never on a picture**. So `turtle` is replaced by a stand-in that records the orders it is
given. The color assertions below are about the *sequence of decisions the branch made*,
which is a computed value; nothing here inspects a rendered color.
"""

import io
import runpy
import sys
from collections.abc import Callable
from types import ModuleType
from typing import cast


class TurtleSpy:
    """Stands in for the turtle module and records orders instead of drawing."""

    def __init__(self) -> None:
        self.calls: list[tuple[str, tuple[object, ...]]] = []

    def __getattr__(self, name: str) -> Callable[..., "TurtleSpy"]:
        def record(*args: object, **_kwargs: object) -> TurtleSpy:
            self.calls.append((name, args))
            return self

        return record

    def firsts(self, *names: str) -> list[float]:
        return [
            float(cast(float, args[0]))
            for called, args in self.calls
            if called in names and args
        ]

    def words(self, *names: str) -> list[str]:
        """The first argument of every call to any of `names`, as lower-case text."""
        return [
            str(args[0]).strip().lower()
            for called, args in self.calls
            if called in names and args and isinstance(args[0], str)
        ]

    def count(self, *names: str) -> int:
        return sum(1 for called, _ in self.calls if called in names)


def run(typed: str = "") -> tuple[TurtleSpy, str]:
    """Run the submission with a recording turtle, and hand back what it did and said."""
    spy = TurtleSpy()
    stdin, stdout = sys.stdin, sys.stdout
    real_turtle = sys.modules.get("turtle")
    sys.modules["turtle"] = cast(ModuleType, spy)
    sys.stdin = io.StringIO(typed)
    sys.stdout = captured = io.StringIO()
    try:
        runpy.run_path("solution.py", run_name="__main__")
    finally:
        sys.stdin, sys.stdout = stdin, stdout
        if real_turtle is None:
            del sys.modules["turtle"]
        else:
            sys.modules["turtle"] = real_turtle
    return spy, captured.getvalue()


PEN = ("color", "pencolor")


def test_draws_twelve_sides() -> None:
    spy, _ = run()
    assert spy.count("forward") == 12


def test_every_side_is_sixty_long() -> None:
    spy, _ = run()
    assert spy.firsts("forward") == [60] * 12


def test_the_turn_is_worked_out_from_the_twelve() -> None:
    spy, _ = run()
    turns = spy.firsts("left", "right")
    assert len(turns) == 12
    assert all(abs(turn - 30) < 1e-9 for turn in turns)


def test_six_red_then_six_black_in_that_order() -> None:
    spy, _ = run()
    assert spy.words(*PEN) == ["red"] * 6 + ["black"] * 6


def test_the_branch_is_inside_the_loop_not_before_it() -> None:
    # One color order per side. A solution that decides once, before the loop, gives
    # one or two -- and draws a shape that is entirely one color, with no error.
    spy, _ = run()
    assert len(spy.words(*PEN)) == 12
