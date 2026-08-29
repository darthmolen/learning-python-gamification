"""Hidden tests for a1-the-countdown. Spec §6.3: these never reach the browser.

Every Area 1 quest draws, and §6.3's rule is that a test asserts on a **computed value,
never on a picture**. So `turtle` is replaced by a stand-in that records the orders it is
given, and the assertions below are about the sequence of lengths the loop produced --
which is exactly the thing the learner cannot get right by guessing.
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
        """The first argument of every call to any of `names`, in the order given."""
        return [
            float(cast(float, args[0]))
            for called, args in self.calls
            if called in names and args
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


EXPECTED = [200, 180, 160, 140, 120, 100, 80, 60, 40]


def test_draws_nine_lines_because_the_condition_says_so() -> None:
    spy, _ = run()
    assert spy.count("forward") == len(EXPECTED)


def test_the_lines_shorten_by_twenty_each_time() -> None:
    spy, _ = run()
    assert spy.firsts("forward") == EXPECTED


def test_it_starts_at_two_hundred() -> None:
    spy, _ = run()
    assert spy.firsts("forward")[0] == 200


def test_it_stops_before_twenty_rather_than_at_it() -> None:
    # `> 20` and `>= 20` differ by exactly one line, and this is that line.
    spy, _ = run()
    drawn = spy.firsts("forward")
    assert min(drawn) == 40
    assert 20 not in drawn


def test_every_turn_is_a_right_angle_to_the_right() -> None:
    spy, _ = run()
    assert spy.firsts("right") == [90] * len(EXPECTED)
