"""Hidden tests for a3-the-inventory. Spec §6.3: these never reach the browser.

The `local-repo` verifier pulls their repository and runs this specification against the
clone (§6.4). **Where the clone is rooted is not pinned down by the API contract**, so this
file reads `PYQUEST_REPO` and falls back to the working directory -- the same line, and the
same caveat, as both Area 2 test files.

HOW THIS CHECKS THE THING IT IS ACTUALLY CHECKING

The quest is not "print five lines". It is **every line must be asked of the list rather
than typed**, and a test that only compared output against a fixed transcript would pass a
program with all five answers hardcoded -- which is precisely the submission this quest
exists to reject.

Reading their source for `len(` would be worse: it rewards the token rather than the
behavior, and `print("carrying:", len([1,2,3,4,5]))` would sail through it.

So the check is **self-consistency, then substitution**:

  1. Run the program as it stands. Assert the output agrees with itself -- the count equals
     the number of slot lines, the slots run 0..n-1 in order, and `first:`/`last:` name the
     items in the first and last slots.
  2. **Add a sixth item to their list and run it again.** Every line must move. A count that
     stays at 5, a `last:` that names the old last thing, or numbering that stops at 4 is a
     program describing a list it is no longer looking at.

Step 2 is the one with teeth, and it is why this file edits a copy of their file rather than
grading a transcript. Their source is copied to a scratch directory first; nothing here
writes to the repository it was given.

WHAT IT DELIBERATELY DOES NOT CHECK

Which five things they carry, what else the program prints, whether the list is a literal or
built in a loop, and anything at all about style. Two of those are the learner's business and
the third is Area 7's.
"""

import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

REPO = pathlib.Path(os.environ.get("PYQUEST_REPO", ".")).resolve()
PROJECT = REPO / "the-inventory"
SCRIPT = PROJECT / "inventory.py"
NOTES = PROJECT / "NOTES.md"

MIN_ITEMS = 5

# Three real sentences, the same substance-over-existence rule the Journal is scored by (§5.6).
MIN_NOTES_CHARACTERS = 150

COUNT = re.compile(r"^carrying:\s*(\d+)\s*$", re.MULTILINE)
FIRST = re.compile(r"^first:\s*(.+?)\s*$", re.MULTILINE)
LAST = re.compile(r"^last:\s*(.+?)\s*$", re.MULTILINE)
SLOT = re.compile(r"^\s+(\d+):\s*(.+?)\s*$", re.MULTILINE)

# Finding the list literal, in two plain steps rather than one clever pattern.
#
# A single regex for "a bracket pair holding at least five quoted strings" needs a repeat
# count spliced into it and a backreference for the quote character, and it becomes
# unreadable at exactly the point where being wrong is expensive. Counting the quoted items
# in Python instead costs one loop and can be read at a glance.
#
# BRACKETS deliberately refuses nested brackets, so a list of lists is not matched and the
# growth check reports "could not find a list" rather than editing the wrong bracket pair.
# DOTALL so a list written across several lines is still one match.
BRACKETS = re.compile(r"\[[^\[\]]*\]", re.DOTALL)
QUOTED = re.compile(r"(['\"])[^'\"]*\1")


def find_list_literal(source: str) -> re.Match[str] | None:
    """The first bracket pair holding at least MIN_ITEMS quoted strings."""
    for candidate in BRACKETS.finditer(source):
        if len(QUOTED.findall(candidate.group(0))) >= MIN_ITEMS:
            return candidate
    return None


def run(script: pathlib.Path, cwd: pathlib.Path) -> str:
    done = subprocess.run(
        [sys.executable, script.name],
        cwd=cwd,
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    )
    assert done.returncode == 0, f"{script.name} did not run cleanly:\n{done.stderr}"
    return done.stdout


def slots(output: str) -> list[tuple[int, str]]:
    return [(int(n), item) for n, item in SLOT.findall(output)]


def test_the_project_directory_exists() -> None:
    assert PROJECT.is_dir(), (
        "expected a directory called the-inventory at the top of your repository"
    )


def test_the_program_is_in_it() -> None:
    assert SCRIPT.is_file(), "expected the-inventory/inventory.py"


def test_it_runs_cleanly_and_prints_something() -> None:
    assert run(SCRIPT, PROJECT).strip(), "inventory.py ran and printed nothing"


def test_it_prints_a_count() -> None:
    found = COUNT.search(run(SCRIPT, PROJECT))
    assert found is not None, "expected a line of the form `carrying: 5`"
    assert int(found.group(1)) >= MIN_ITEMS, (
        f"the inventory holds {found.group(1)}; the brief asks for at least {MIN_ITEMS}"
    )


def test_it_prints_every_slot_numbered_from_zero() -> None:
    numbered = slots(run(SCRIPT, PROJECT))
    assert numbered, "expected one indented line per slot, like `  0: torch`"
    assert [n for n, _ in numbered] == list(range(len(numbered))), (
        f"the slot numbers are {[n for n, _ in numbered]}; they should run "
        f"0 to {len(numbered) - 1}, counting from zero"
    )


def test_the_count_agrees_with_the_slots() -> None:
    output = run(SCRIPT, PROJECT)
    found = COUNT.search(output)
    assert found is not None, "expected a line of the form `carrying: 5`"
    assert int(found.group(1)) == len(slots(output)), (
        f"`carrying:` says {found.group(1)} but there are {len(slots(output))} slot lines. "
        "One of the two was typed rather than asked for."
    )


def test_first_and_last_name_the_right_slots() -> None:
    output = run(SCRIPT, PROJECT)
    numbered = slots(output)
    first, last = FIRST.search(output), LAST.search(output)
    assert first is not None, "expected a line of the form `first: torch`"
    assert last is not None, "expected a line of the form `last: flint`"
    assert first.group(1) == numbered[0][1], (
        f"`first:` says {first.group(1)!r}, but slot 0 holds {numbered[0][1]!r}"
    )
    assert last.group(1) == numbered[-1][1], (
        f"`last:` says {last.group(1)!r}, but the last slot holds {numbered[-1][1]!r}. "
        "The last position is len(x) - 1, not len(x)."
    )


def test_every_line_follows_when_the_list_grows() -> None:
    """The quest, asserted. Add a sixth thing and change nothing else.

    A count that stays put, a `last:` that names the old last thing, or numbering that stops
    one short is a program describing a list it is no longer looking at. This runs against a
    copy: nothing here writes to their repository.
    """
    source = SCRIPT.read_text(encoding="utf-8")
    literal = find_list_literal(source)
    assert literal is not None, (
        "could not find a list of at least five quoted items in inventory.py. If your "
        "inventory is built some other way, say so in NOTES.md and ask for a sign-off."
    )

    grown = source[: literal.end() - 1].rstrip().rstrip(",") + ', "ADDED-BY-THE-TEST"]' + source[literal.end():]

    with tempfile.TemporaryDirectory() as scratch:
        copy_dir = pathlib.Path(scratch)
        for entry in PROJECT.iterdir():
            if entry.is_file():
                shutil.copy2(entry, copy_dir / entry.name)
        copied = copy_dir / SCRIPT.name
        copied.write_text(grown, encoding="utf-8")

        before = run(SCRIPT, PROJECT)
        after = run(copied, copy_dir)

    was, now = slots(before), slots(after)
    assert len(now) == len(was) + 1, (
        f"one more item went in, and the program printed {len(now)} slots where it printed "
        f"{len(was)} before. The slot lines are not coming from the list."
    )

    count_after = COUNT.search(after)
    assert count_after is not None and int(count_after.group(1)) == len(now), (
        "`carrying:` did not follow when the list grew. It was typed, not asked for."
    )

    last_after = LAST.search(after)
    assert last_after is not None and last_after.group(1) == "ADDED-BY-THE-TEST", (
        f"`last:` still says {last_after.group(1) if last_after else None!r} after a sixth "
        "item was added. The last item is being named rather than found."
    )


def test_the_notes_say_where_the_last_slot_is() -> None:
    assert NOTES.is_file(), "expected the-inventory/NOTES.md"
    written = NOTES.read_text(encoding="utf-8").strip()
    assert len(written) >= MIN_NOTES_CHARACTERS, (
        "NOTES.md is too short. Three sentences: where the last slot is and why it is not "
        "the count, one thing that printed the wrong number, and what inventory[-1] does."
    )
