"""Hidden tests for a0-the-perimeter. Spec §6.3: these never reach the browser.

The exercise is "compute it, do not type it", so the whole test is: change the height
and see whether the answer follows. A submission with `print("perimeter:", 360)` still
in it passes every check that only runs the file once, which is exactly why none of
these do.

`turtle` is replaced by a stand-in that records orders instead of drawing. The runner is
`python:3.14-alpine` (§6.6) and has neither tkinter nor a display, so importing the real
turtle would fail before a single assertion ran. §6.3's rule points the same way: assert
on a computed value, never on a picture.

The height is rewritten in the source before each run. That is the only way to prove the
number was computed in an area where `def` does not exist yet — there is no function to
call with a different argument.
"""

import io
import pathlib
import re
import runpy
import sys
import tempfile
from collections.abc import Callable
from types import ModuleType
from typing import cast

SUBMISSION = pathlib.Path("solution.py")

# `height = 60`, `height=60`, `h = 60` — any single name bound to a bare int on its own
# line. Deliberately loose: the learner chooses the name, and §3 principle 3 says give
# options everywhere. Whichever number is smallest is the height, because task 2 says the
# width is twice it.
ASSIGNMENT = re.compile(r"^([A-Za-z_]\w*)\s*=\s*(\d+)\s*$", re.MULTILINE)


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


def run(source: str) -> tuple[TurtleSpy, str]:
    """Run `source` as a program, with turtle stubbed and stdout captured."""
    spy = TurtleSpy()
    real_turtle = sys.modules.get("turtle")
    sys.modules["turtle"] = cast(ModuleType, spy)
    stdout = sys.stdout
    sys.stdout = captured = io.StringIO()
    try:
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "submission.py"
            path.write_text(source, encoding="utf-8")
            runpy.run_path(str(path), run_name="__main__")
    finally:
        sys.stdout = stdout
        if real_turtle is None:
            del sys.modules["turtle"]
        else:
            sys.modules["turtle"] = real_turtle
    return spy, captured.getvalue()


def with_height(new_height: int) -> tuple[TurtleSpy, str]:
    """Rewrite the submission's smallest bare-int assignment and run it."""
    source = SUBMISSION.read_text(encoding="utf-8")
    found = ASSIGNMENT.findall(source)
    assert found, "no `name = <number>` line found — task 1 asks for one"
    name, _ = min(found, key=lambda pair: int(pair[1]))
    patched = re.sub(
        rf"^{re.escape(name)}\s*=\s*\d+\s*$",
        f"{name} = {new_height}",
        source,
        count=1,
        flags=re.MULTILINE,
    )
    return run(patched)


def printed_perimeter(out: str) -> float:
    match = re.search(r"perimeter:\s*(-?\d+(?:\.\d+)?)", out)
    assert match, f"no line matching `perimeter: <number>` in output:\n{out}"
    return float(match.group(1))


def test_it_draws_a_rectangle_twice_as_wide_as_tall() -> None:
    spy, _ = with_height(60)
    sides = spy.firsts("forward")
    assert len(sides) == 4, f"a rectangle has four sides, got {len(sides)}"
    assert sorted(sides) == [60, 60, 120, 120], f"not 2:1 at height 60: {sides}"


def test_the_perimeter_is_right_at_the_starting_height() -> None:
    _, out = with_height(60)
    assert printed_perimeter(out) == 360


def test_the_perimeter_follows_when_the_height_changes() -> None:
    """The one that catches a typed answer. 360 is right at 60 and wrong at 50."""
    _, out = with_height(50)
    assert printed_perimeter(out) == 300, (
        "perimeter did not change with the height — it looks typed, not computed"
    )


def test_the_rectangle_follows_too() -> None:
    """A perimeter computed from names, but a shape still drawn from typed numbers."""
    spy, _ = with_height(50)
    sides = spy.firsts("forward")
    assert sorted(sides) == [50, 50, 100, 100], f"shape did not follow the height: {sides}"


def test_only_one_number_is_editable() -> None:
    """Task 2: the width is derived, so changing the height alone changes both."""
    small, _ = with_height(30)
    large, _ = with_height(90)
    assert sorted(small.firsts("forward")) == [30, 30, 60, 60]
    assert sorted(large.firsts("forward")) == [90, 90, 180, 180]
