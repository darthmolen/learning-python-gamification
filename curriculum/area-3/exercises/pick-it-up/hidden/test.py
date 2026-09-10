"""Hidden tests for a3-pick-it-up. Spec §6.3: these never reach the browser.

The `local-repo` verifier pulls their repository and runs this against the clone (§6.4).
`PYQUEST_REPO` with a working-directory fallback, the same line and the same caveat as every
other `local-repo` test in the campaign.

HOW THIS CHECKS THE THING IT IS ACTUALLY CHECKING

The quest is that **every `now:` line is the backpack rather than a description of it**. So
this file does not compare the output to a transcript, and it does not read their source for
`append` or `remove`. It **replays their own moves**.

Take the `start:` line as a list. Walk the moves in order, applying each to that list the way
Python would. After each one, the program's `now:` line must match what the replay holds. A
submission that prints four states it typed out by hand disagrees with the replay the moment
any move is anything other than what its `now:` line claims.

That also makes the failure message useful: it can say which move went wrong, what the
backpack should have held afterwards, and what the program said instead.

WHAT IT DELIBERATELY DOES NOT CHECK

Which things they carry, how many moves beyond the minimum, whether the moves are written as
a loop or four lines in a row, and anything about style. The `- thing` that raises
`ValueError` when the thing is absent is the learner's to discover; a submission that crashes
fails on the clean-run assertion, with the traceback attached, which is the honest report.
"""

import os
import pathlib
import re
import subprocess
import sys

REPO = pathlib.Path(os.environ.get("PYQUEST_REPO", ".")).resolve()
PROJECT = REPO / "pick-it-up"
SCRIPT = PROJECT / "backpack.py"
NOTES = PROJECT / "NOTES.md"

MIN_START = 3
MIN_MOVES = 4
MIN_NOTES_CHARACTERS = 150

START = re.compile(r"^start:\s*(.*)$", re.MULTILINE)
# One pattern per line shape, so an unknown line is simply not a move rather than a failure:
# the brief allows a program to print whatever else it likes around the account.
ADD = re.compile(r"^\+[ \t]*(.+?)[ \t]*$")
DROP = re.compile(r"^-[ \t]*(.+?)[ \t]*$")
POP = re.compile(r"^pop:[ \t]*(.*?)[ \t]*$")
NOW = re.compile(r"^now:[ \t]*(.*?)[ \t]*$")


def items(line: str) -> list[str]:
    """A comma-separated backpack. An empty tail is an empty backpack, not one blank item."""
    return [part.strip() for part in line.split(",") if part.strip()]


def run() -> str:
    done = subprocess.run(
        [sys.executable, SCRIPT.name],
        cwd=PROJECT,
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    )
    assert done.returncode == 0, f"backpack.py did not run cleanly:\n{done.stderr}"
    return done.stdout


def account(output: str) -> tuple[list[str], list[tuple[str, str, list[str]]]]:
    """The starting backpack, and every (move, argument, claimed backpack) after it."""
    start = START.search(output)
    assert start is not None, "expected a line of the form `start: torch, bread`"

    moves: list[tuple[str, str, list[str]]] = []
    pending: tuple[str, str] | None = None
    for line in output.splitlines()[output.splitlines().index(start.group(0)) + 1 :]:
        for name, pattern in (("+", ADD), ("-", DROP), ("pop", POP)):
            found = pattern.match(line.strip()) if name == "pop" else pattern.match(line)
            if found is not None:
                pending = (name, found.group(1).strip())
                break
        else:
            shown = NOW.match(line)
            if shown is not None and pending is not None:
                moves.append((pending[0], pending[1], items(shown.group(1))))
                pending = None
    return items(start.group(1)), moves


def test_the_project_directory_exists() -> None:
    assert PROJECT.is_dir(), "expected a directory called pick-it-up at the top of your repository"


def test_the_program_is_in_it() -> None:
    assert SCRIPT.is_file(), "expected pick-it-up/backpack.py"


def test_it_runs_cleanly() -> None:
    assert run().strip(), "backpack.py ran and printed nothing"


def test_it_starts_with_enough_to_work_with() -> None:
    start, _ = account(run())
    assert len(start) >= MIN_START, (
        f"the backpack starts with {len(start)} things; the brief asks for at least {MIN_START}"
    )


def test_it_makes_enough_moves() -> None:
    _, moves = account(run())
    assert len(moves) >= MIN_MOVES, (
        f"found {len(moves)} moves, each a `+`, `-` or `pop:` line followed by a `now:` line; "
        f"the brief asks for at least {MIN_MOVES}"
    )


def test_it_uses_more_than_one_kind_of_move() -> None:
    """Four appends is not the quest. `remove` and `pop` are the pair worth telling apart."""
    _, moves = account(run())
    kinds = {kind for kind, _, _ in moves}
    assert len(kinds) >= 2, (
        f"every move is `{kinds.pop() if kinds else 'none'}`. The quest is about telling the "
        "moves apart, so use at least two of `+`, `-` and `pop:`."
    )


def test_every_now_line_is_the_backpack() -> None:
    """The quest, asserted. Replay their moves and compare, move by move."""
    start, moves = account(run())

    backpack = list(start)
    for number, (kind, argument, claimed) in enumerate(moves, start=1):
        if kind == "+":
            backpack.append(argument)
        elif kind == "-":
            assert argument in backpack, (
                f"move {number} is `- {argument}`, but the backpack holds {backpack} and "
                f"{argument!r} is not in it. `remove` takes a value that is there."
            )
            backpack.remove(argument)
        else:
            assert backpack, f"move {number} is a `pop:` on an empty backpack"
            taken = backpack.pop()
            assert taken == argument, (
                f"move {number} says `pop: {argument}`, but the last thing in {start if number == 1 else 'the backpack'} "
                f"was {taken!r}. `pop` hands back the LAST item, and that is what it handed back."
            )

        assert claimed == backpack, (
            f"after move {number} (`{kind} {argument}`) the backpack holds {backpack}, "
            f"but the program printed {claimed}. That `now:` line is not the backpack."
        )


def test_the_notes_tell_the_two_moves_apart() -> None:
    assert NOTES.is_file(), "expected pick-it-up/NOTES.md"
    written = NOTES.read_text(encoding="utf-8").strip()
    assert len(written) >= MIN_NOTES_CHARACTERS, (
        "NOTES.md is too short. Three sentences: what `remove` and `pop` each take and which "
        "hands something back, what happened when you removed something absent, and one move "
        "that did not do what you expected."
    )
