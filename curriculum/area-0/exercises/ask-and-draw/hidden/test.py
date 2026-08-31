"""Hidden tests for a0-ask-and-draw. Spec §6.3: these never reach the browser.

`curriculum/area-0/README.md` picked this one because it verifies cleanly: feed stdin,
assert on stdout, and the f-string receipt is exactly checkable.

Every run feeds a different number, which is the whole test. A submission that types the
perimeter passes at 150 and fails at 40, and a submission that converts `answer` four
times still passes — that is a style point for the DM to raise, not something a hidden
test should fail somebody for.

`turtle` is stubbed. The runner is `python:3.14-alpine` (§6.6) with neither tkinter nor a
display, so the real module would fail at import before any assertion ran.
"""

import io
import pathlib
import re
import runpy
import sys
from collections.abc import Callable
from types import ModuleType
from typing import cast

SUBMISSION = pathlib.Path("solution.py")


class TurtleSpy:
    def __init__(self) -> None:
        self.calls: list[tuple[str, tuple[object, ...]]] = []

    def __getattr__(self, name: str) -> Callable[..., "TurtleSpy"]:
        def record(*args: object, **_kwargs: object) -> TurtleSpy:
            self.calls.append((name, args))
            return self

        return record

    def firsts(self, *names: str) -> list[float]:
        """First argument of each matching call, as a float.

        Coercing here is safe only because `raw` below is what checks the TYPE. A str
        that happens to look like a number floats cleanly, which is exactly the session-5
        bug this quest exists to catch, so it must not be caught here by accident.
        """
        return [
            float(cast(float, args[0]))
            for called, args in self.calls
            if called in names and args
        ]

    def raw(self, *names: str) -> list[object]:
        """First argument of each matching call, untouched."""
        return [args[0] for called, args in self.calls if called in names and args]


def run(typed: str) -> tuple[TurtleSpy, str]:
    """Run the submission with `typed` on stdin, turtle stubbed, stdout captured."""
    spy = TurtleSpy()
    real_turtle = sys.modules.get("turtle")
    sys.modules["turtle"] = cast(ModuleType, spy)
    stdin, stdout = sys.stdin, sys.stdout
    sys.stdin = io.StringIO(typed + "\n")
    sys.stdout = captured = io.StringIO()
    try:
        runpy.run_path(str(SUBMISSION), run_name="__main__")
    finally:
        sys.stdin, sys.stdout = stdin, stdout
        if real_turtle is None:
            del sys.modules["turtle"]
        else:
            sys.modules["turtle"] = real_turtle
    return spy, captured.getvalue()


RECEIPT = re.compile(r"side\s+(\d+)\s*,\s*perimeter\s+(\d+)")


def receipt(out: str) -> tuple[int, int]:
    match = RECEIPT.search(out)
    assert match, f"no line matching `side <n>, perimeter <n>` in output:\n{out}"
    return int(match.group(1)), int(match.group(2))


def test_it_converts_before_drawing() -> None:
    """forward() must receive a NUMBER, not a str that looks like one.

    This is the session-5 bug: `turtle.forward(answer)` with `answer` straight off
    `input()`. Asserting on the value alone would not catch it, because "150" and 150
    compare equal once floated — so this asserts on the type.
    """
    spy, _ = run("150")
    given = spy.raw("forward")
    assert len(given) == 4, f"expected four sides, got {len(given)}"
    for value in given:
        assert isinstance(value, (int, float)) and not isinstance(value, bool), (
            f"forward() got {value!r}, a {type(value).__name__} — input() hands back a str "
            "and it has to be converted before it can be drawn with"
        )
    assert spy.firsts("forward") == [150.0] * 4


def test_the_receipt_reports_what_was_typed() -> None:
    _, out = run("150")
    side, _ = receipt(out)
    assert side == 150


def test_the_perimeter_is_computed_not_typed() -> None:
    """600 is right at 150 and wrong at 40. This is the one that catches a typed answer."""
    _, out = run("40")
    side, perimeter = receipt(out)
    assert side == 40, f"receipt says side {side} after 40 was typed"
    assert perimeter == 160, (
        f"perimeter {perimeter} did not follow the input — it looks typed, not computed"
    )


def test_the_square_follows_the_input_too() -> None:
    spy, _ = run("40")
    assert spy.firsts("forward") == [40.0, 40.0, 40.0, 40.0]


def test_it_still_works_for_a_third_number() -> None:
    """Two data points can be luck. Three is a pattern."""
    spy, out = run("7")
    side, perimeter = receipt(out)
    assert (side, perimeter) == (7, 28)
    assert spy.firsts("forward") == [7.0, 7.0, 7.0, 7.0]
