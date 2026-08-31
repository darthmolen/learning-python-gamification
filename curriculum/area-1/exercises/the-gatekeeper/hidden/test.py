"""Hidden tests for a1-the-gatekeeper. Spec §6.3: these never reach the browser.

Every Area 1 quest draws, and §6.3's rule is that a test asserts on a **computed value,
never on a picture**. So `turtle` is replaced by a stand-in that records the orders it is
given, and the assertions below are about which branch of the ladder ran -- counted in
orders given and words printed, not in pixels.

The four boundary answers are here on purpose: 20, 100 and 300 are all exact values a
person will type, and `<` against `<=` is where this quest is won or lost.
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


def test_refuses_a_size_below_twenty() -> None:
    spy, said = run("10\n")
    assert "REFUSED" in said.upper()
    assert spy.count("forward") == 0


def test_refuses_a_size_above_three_hundred() -> None:
    spy, said = run("400\n")
    assert "REFUSED" in said.upper()
    assert spy.count("forward") == 0


def test_a_refusal_draws_nothing_at_all() -> None:
    # Refusing is the easy half. Refusing and then not drawing anyway is the quest.
    spy, _ = run("5\n")
    assert spy.count("forward", "backward", "circle") == 0


def test_a_small_size_draws_a_square_with_a_thin_pen() -> None:
    spy, said = run("50\n")
    assert "REFUSED" not in said.upper()
    assert spy.firsts("forward") == [50] * 4
    assert spy.firsts("pensize") == [3]


def test_a_big_size_draws_a_square_with_a_thick_pen() -> None:
    spy, said = run("200\n")
    assert "REFUSED" not in said.upper()
    assert spy.firsts("forward") == [200] * 4
    assert spy.firsts("pensize") == [8]


def test_twenty_exactly_is_accepted_and_thin() -> None:
    spy, said = run("20\n")
    assert "REFUSED" not in said.upper()
    assert spy.firsts("pensize") == [3]


def test_a_hundred_exactly_is_still_thin_and_a_hundred_and_one_is_not() -> None:
    thin, _ = run("100\n")
    thick, _ = run("101\n")
    assert thin.firsts("pensize") == [3]
    assert thick.firsts("pensize") == [8]


def test_three_hundred_exactly_is_accepted() -> None:
    spy, said = run("300\n")
    assert "REFUSED" not in said.upper()
    assert spy.firsts("forward") == [300] * 4
