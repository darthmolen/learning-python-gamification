"""Hidden tests for a0-name-tag. Spec §6.3: these never reach the browser."""

import io
import runpy
import sys


def _run_with_input(typed: str) -> str:
    stdin, stdout = sys.stdin, sys.stdout
    sys.stdin = io.StringIO(typed + "\n")
    sys.stdout = captured = io.StringIO()
    try:
        runpy.run_path("solution.py", run_name="__main__")
    finally:
        sys.stdin, sys.stdout = stdin, stdout
    return captured.getvalue()


def test_greets_the_name_that_was_typed() -> None:
    assert "Welcome, Steve!" in _run_with_input("Steve")


def test_greets_a_different_name_rather_than_hard_coding_one() -> None:
    assert "Welcome, Alex!" in _run_with_input("Alex")


def test_prints_exactly_one_line() -> None:
    assert _run_with_input("Steve").strip().count("\n") == 0
