"""Hidden tests for a1-the-polygon-engine. Spec §6.3: these never reach the browser.

Every Area 1 quest draws, and §6.3's rule is that a test asserts on a **computed value,
never on a picture**. So `turtle` is replaced by a stand-in that records the orders it is
given, and the assertions below are all about numbers the program worked out: how many
sides, what angle, how long. Nothing here looks at a pixel.
"""

import io
import runpy
import sys
from collections.abc import Callable
from types import ModuleType
from typing import cast


class TurtleSpy:
    """Stands in for the turtle module and records orders instead of drawing.

    Any attribute at all answers, and answers with itself, so a solution that reaches
    for an order these tests do not care about still runs rather than failing on the
    scaffolding.
    """

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


def test_draws_one_side_for_every_side_asked_for() -> None:
    spy, _ = run("6\n")
    assert spy.count("forward") == 6


def test_a_different_answer_draws_a_different_number_of_sides() -> None:
    spy, _ = run("5\n")
    assert spy.count("forward") == 5


def test_every_side_is_a_hundred_long() -> None:
    spy, _ = run("7\n")
    assert spy.firsts("forward") == [100] * 7


def test_the_turn_is_worked_out_from_the_side_count() -> None:
    spy, _ = run("6\n")
    turns = spy.firsts("left", "right")
    assert len(turns) == 6
    assert all(abs(turn - 60) < 1e-9 for turn in turns)


def test_the_turn_follows_when_the_side_count_changes() -> None:
    # A typed 60 passes the hexagon and fails here. That is the point of the quest.
    spy, _ = run("5\n")
    turns = spy.firsts("left", "right")
    assert len(turns) == 5
    assert all(abs(turn - 72) < 1e-9 for turn in turns)


def test_the_turns_add_up_to_one_full_circle() -> None:
    spy, _ = run("9\n")
    assert abs(sum(spy.firsts("left", "right")) - 360) < 1e-6
