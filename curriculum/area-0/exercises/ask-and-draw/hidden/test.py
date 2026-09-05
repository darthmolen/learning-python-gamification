"""Hidden tests for a0-ask-and-draw. Spec §6.3: these never reach the browser.

`curriculum/area-0/README.md` picked this one because it verifies cleanly: feed stdin,
assert on stdout, and the f-string receipt is exactly checkable.

Every run feeds a different number, which is the whole test. A submission that types 150
into the receipt passes once and fails twice, and a submission that converts `answer` four
times still passes — that is a style point for the DM to raise, not something a hidden
test should fail somebody for. Naming the turn angle is optional in the brief and is not
checked here at all: a quest must not fail somebody for declining something it called
optional.

**The perimeter is deliberately not here.** "Compute it, do not type it" is the whole of
`the-perimeter`, a quest of its own in this area, and asking for it twice made this one
about arithmetic when it is about `input()` handing back a `str`.

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


RECEIPT = re.compile(r"side\s+length\s*:\s*(\d+)")


def receipt(out: str) -> int:
    match = RECEIPT.search(out)
    assert match, f"no line matching `side length: <n>` in output:\n{out}"
    return int(match.group(1))


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
    assert receipt(out) == 150


def test_the_receipt_is_built_not_typed() -> None:
    """`side length: 150` is right once and wrong twice. This catches a typed receipt."""
    spy, out = run("40")
    side = receipt(out)
    assert side == 40, (
        f"receipt says side length {side} after 40 was typed — it looks typed, not built "
        "from the answer"
    )
    assert spy.firsts("forward") == [40.0, 40.0, 40.0, 40.0]


def test_it_still_works_for_a_third_number() -> None:
    """Two data points can be luck. Three is a pattern."""
    spy, out = run("7")
    assert receipt(out) == 7
    assert spy.firsts("forward") == [7.0, 7.0, 7.0, 7.0]
