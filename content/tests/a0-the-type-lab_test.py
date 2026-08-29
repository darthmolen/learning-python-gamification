"""Hidden tests for a0-the-type-lab. Spec §6.3: these never reach the browser.

Six answers, each a value rather than an opinion, which is why this exercise verifies
cleanly — `curriculum/area-0/README.md` picked it for exactly that reason.

Nothing here imports turtle, but the submission may: the starter's own session-4 exercise
drew a triangle, and a learner who copies from it will bring the import along. The runner
is `python:3.14-alpine` (§6.6) with neither tkinter nor a display, so turtle is stubbed
here too rather than left to fail.

The assertions read the labels the brief pins down. They are deliberately forgiving about
spacing and about what surrounds the answer, and strict about the answer itself — a
learner who writes `<class 'int'>` and one who writes `<class 'int'> ` have both found
the same thing.
"""

import io
import pathlib
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


def run() -> str:
    spy = TurtleSpy()
    real_turtle = sys.modules.get("turtle")
    sys.modules["turtle"] = cast(ModuleType, spy)
    stdout = sys.stdout
    sys.stdout = captured = io.StringIO()
    try:
        runpy.run_path(str(SUBMISSION), run_name="__main__")
    finally:
        sys.stdout = stdout
        if real_turtle is None:
            del sys.modules["turtle"]
        else:
            sys.modules["turtle"] = real_turtle
    return captured.getvalue()


def answer(out: str, label: str) -> str:
    """The rest of the line after `label:`, stripped."""
    for line in out.splitlines():
        head, sep, tail = line.partition(":")
        if sep and head.strip().lower() == label.lower():
            return tail.strip()
    raise AssertionError(f"no line labelled {label!r} in output:\n{out}")


def test_found_the_other_division_operator() -> None:
    """100 // 3 is 33. 100 / 3 is 33.333..., which is the answer being replaced."""
    assert answer(run(), "floor division") == "33"


def test_whole_number_division_reports_int() -> None:
    assert answer(run(), "whole number division gives") == "<class 'int'>"


def test_int_of_a_string_is_an_int() -> None:
    """type("120") is str. type(int("120")) is int. The conversion is the point."""
    assert answer(run(), 'int("120") is') == "<class 'int'>"


def test_str_of_an_int_is_a_str() -> None:
    assert answer(run(), 'str(120) is') == "<class 'str'>"


def test_named_the_error_that_int_of_a_decimal_string_raises() -> None:
    """int("12.5") raises ValueError. Reading the error is the Area 0 skill."""
    assert answer(run(), 'int("12.5") does').strip("'\"") == "ValueError"


def test_true_plus_true_is_two() -> None:
    """bool is a subclass of int, and this is where a learner first meets that."""
    assert answer(run(), "True + True is") == "2"


def test_nothing_was_left_unanswered() -> None:
    out = run()
    assert "no idea yet" not in out, "at least one placeholder answer is still in place"
