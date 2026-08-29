"""Hidden tests for a1-the-growing-spiral. Spec §6.3: these never reach the browser.

Every Area 1 quest draws, and §6.3's rule is that a test asserts on a **computed value,
never on a picture**. So `turtle` is replaced by a stand-in that records the orders it is
given. The two things checked here are the sequence of line lengths -- which is the
nesting and the growing accumulator -- and the printed total, which is the measuring one.
Neither is a pixel.
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


ARM = [10.0 + 5 * step for step in range(12)]
TOTAL = int(sum(ARM) * 3)


def test_three_arms_of_twelve_lines_is_thirty_six_not_fifteen() -> None:
    # Counts multiply. Adding them is the first thing everyone gets wrong about nesting.
    spy, _ = run()
    assert spy.count("forward") == 36


def test_each_line_is_five_longer_than_the_one_before() -> None:
    spy, _ = run()
    assert spy.firsts("forward")[:12] == ARM


def test_every_arm_starts_its_lengths_again() -> None:
    spy, _ = run()
    assert spy.firsts("forward") == ARM * 3


def test_it_reports_the_total_it_worked_out() -> None:
    _, said = run()
    assert f"Ink used: {TOTAL}" in said


def test_the_total_is_reported_once_not_once_per_line() -> None:
    # A print inside the loop gives thirty-six lines and no error of any kind.
    _, said = run()
    assert said.count("Ink used") == 1


def test_it_turns_after_every_line_and_between_the_arms() -> None:
    spy, _ = run()
    assert spy.count("left", "right") >= 36
