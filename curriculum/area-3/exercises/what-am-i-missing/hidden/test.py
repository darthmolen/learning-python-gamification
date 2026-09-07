"""Hidden tests for a3-what-am-i-missing. Spec §6.3: these never reach the browser.

`local-repo` (§6.4), `PYQUEST_REPO` with a working-directory fallback.

HOW THIS CHECKS THE THING IT IS ACTUALLY CHECKING

The bug this quest exists to catch does not crash. `have - need` where `need - have` was
meant produces a confident, well-formatted, wrong answer, and the DM guide predicts it by
name as the practice's first stall.

So the three answers are checked **against the two sets the program itself printed**, and
each is checked separately rather than as a group -- because `missing:` and `spare:` being
swapped is one mistake with two symptoms, and a test that reported "the sets disagree" would
leave the learner hunting for which.

The setup is asserted too, and that is not padding. If nothing is missing, or nothing is
spare, then `need - have` and `have - need` can coincide and the direction is never tested.
The brief asks for both and this checks that both are true.

Order is never compared. A set has none, and a submission that prints its answers in any
order is correct.

WHAT IT DELIBERATELY DOES NOT CHECK

Whether they used `-`, `&`, `.difference()`, or a loop with `not in`; what the items are; or
anything about style. The brief allows any of those and Practice 5's loop is explicitly one
of them.
"""

import os
import pathlib
import re
import subprocess
import sys

REPO = pathlib.Path(os.environ.get("PYQUEST_REPO", ".")).resolve()
PROJECT = REPO / "what-am-i-missing"
SCRIPT = PROJECT / "missing.py"
NOTES = PROJECT / "NOTES.md"

MIN_NOTES_CHARACTERS = 150

LABELS = ("need", "have", "missing", "spare", "both")
PATTERNS = {
    label: re.compile(rf"^{label}:[ \t]*(.*?)[ \t]*$", re.MULTILINE) for label in LABELS
}


def things(line: str) -> set[str]:
    """A comma-separated set. An empty tail is an empty set, not one blank item."""
    return {part.strip() for part in line.split(",") if part.strip()}


def run() -> str:
    done = subprocess.run(
        [sys.executable, SCRIPT.name],
        cwd=PROJECT,
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    )
    assert done.returncode == 0, f"missing.py did not run cleanly:\n{done.stderr}"
    return done.stdout


def read() -> dict[str, set[str]]:
    output = run()
    found: dict[str, set[str]] = {}
    for label in LABELS:
        match = PATTERNS[label].search(output)
        assert match is not None, f"expected a line of the form `{label}: stick, coal`"
        found[label] = things(match.group(1))
    return found


def test_the_project_directory_exists() -> None:
    assert PROJECT.is_dir(), (
        "expected a directory called what-am-i-missing at the top of your repository"
    )


def test_the_program_is_in_it() -> None:
    assert SCRIPT.is_file(), "expected what-am-i-missing/missing.py"


def test_it_runs_cleanly() -> None:
    assert run().strip(), "missing.py ran and printed nothing"


def test_both_sets_have_something_in_them() -> None:
    lines = read()
    assert lines["need"], "`need:` is empty, so there is no question to answer"
    assert lines["have"], "`have:` is empty, so `missing:` is just `need:` again"


def test_something_is_actually_missing() -> None:
    """Without this the direction is never tested: `need - have` would be empty either way."""
    lines = read()
    assert lines["need"] - lines["have"], (
        f"`need:` {sorted(lines['need'])} is fully covered by `have:` "
        f"{sorted(lines['have'])}, so nothing is missing. The brief asks for at least one "
        "thing you do not have -- otherwise getting the subtraction backwards still prints "
        "an empty line and looks right."
    )


def test_something_is_actually_spare() -> None:
    """And without this, `need - have` and `have - need` can be the same set."""
    lines = read()
    assert lines["have"] - lines["need"], (
        f"`have:` {sorted(lines['have'])} carries nothing the job does not need, so "
        "`missing:` and `spare:` cannot be told apart. The brief asks for at least one "
        "spare thing."
    )


def test_missing_is_need_without_have() -> None:
    """The one the DM guide predicts by name. Backwards is a wrong answer, not a crash."""
    lines = read()
    expected = lines["need"] - lines["have"]
    assert lines["missing"] == expected, (
        f"`missing:` says {sorted(lines['missing'])} and should say {sorted(expected)}. "
        f"If it says {sorted(lines['have'] - lines['need'])}, the subtraction is the wrong "
        "way round: `missing` is what the job needs minus what you are carrying."
    )


def test_spare_is_have_without_need() -> None:
    lines = read()
    expected = lines["have"] - lines["need"]
    assert lines["spare"] == expected, (
        f"`spare:` says {sorted(lines['spare'])} and should say {sorted(expected)}"
    )


def test_both_is_the_overlap() -> None:
    lines = read()
    expected = lines["need"] & lines["have"]
    assert lines["both"] == expected, (
        f"`both:` says {sorted(lines['both'])} and should say {sorted(expected)}"
    )


def test_the_three_answers_account_for_everything() -> None:
    """A whole-shape check, after the three that name a single line each.

    Every item in either set falls into exactly one of missing, spare or both. This catches
    an answer that is wrong in a way none of the three above happens to look at.
    """
    lines = read()
    everything = lines["need"] | lines["have"]
    accounted = lines["missing"] | lines["spare"] | lines["both"]
    assert accounted == everything, (
        f"the three answers cover {sorted(accounted)}, but the two sets between them hold "
        f"{sorted(everything)}. Something is in neither, or in something it should not be."
    )
    overlaps = (
        (lines["missing"] & lines["spare"])
        | (lines["missing"] & lines["both"])
        | (lines["spare"] & lines["both"])
    )
    assert not overlaps, (
        f"{sorted(overlaps)} appears in more than one answer. Each thing is missing, spare "
        "or in both -- never two of those."
    )


def test_the_notes_say_what_the_subtraction_asks() -> None:
    assert NOTES.is_file(), "expected what-am-i-missing/NOTES.md"
    written = NOTES.read_text(encoding="utf-8").strip()
    assert len(written) >= MIN_NOTES_CHARACTERS, (
        "NOTES.md is too short. Three sentences: what `need - have` asks as a sentence, what "
        "Practice 5's loop could do that the subtraction cannot, and what a set lost that a "
        "dict would have kept."
    )
