"""Hidden tests for a3-the-hotbar. Spec §6.3: these never reach the browser.

`local-repo` (§6.4), `PYQUEST_REPO` with a working-directory fallback.

HOW THIS CHECKS THE THING IT IS ACTUALLY CHECKING

The quest is the stopping rule -- `[0:9]` is nine, not ten -- and that both halves are
**views of one list** rather than two lists typed out.

Self-consistency catches the first: `hotbar` must be the first nine of `all`, `rest` the
remainder, and the two must reassemble into `all` exactly.

Substitution catches the second: **three more items go into a copy of their list**, and
`hotbar:` must not move while `rest:` grows by three. A pair of hand-typed lists agrees with
itself perfectly and falls apart the moment the list underneath changes, which is the whole
difference the quest is about.

The growth check runs against a copy in a temporary directory; nothing here writes to the
repository it was given.

WHAT IT DELIBERATELY DOES NOT CHECK

Whether they wrote `[0:9]` or `[:9]`, whether `rest` came from `[9:]` or a loop, what the
twelve things are, or anything about style. A submission is free to build the halves any way
it likes provided the halves follow the list.
"""

import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

REPO = pathlib.Path(os.environ.get("PYQUEST_REPO", ".")).resolve()
PROJECT = REPO / "the-hotbar"
SCRIPT = PROJECT / "hotbar.py"
NOTES = PROJECT / "NOTES.md"

HOTBAR_SIZE = 9
MIN_ITEMS = 12
GROWN_BY = 3
MIN_NOTES_CHARACTERS = 150

ALL = re.compile(r"^all:[ \t]*(.*?)[ \t]*$", re.MULTILINE)
HOTBAR = re.compile(r"^hotbar:[ \t]*(.*?)[ \t]*$", re.MULTILINE)
REST = re.compile(r"^rest:[ \t]*(.*?)[ \t]*$", re.MULTILINE)

# The same two-step matcher as a3-the-inventory: a bracket pair with no nested brackets,
# holding enough quoted strings to be the inventory rather than some other list.
BRACKETS = re.compile(r"\[[^\[\]]*\]", re.DOTALL)
QUOTED = re.compile(r"(['\"])[^'\"]*\1")


def find_list_literal(source: str) -> re.Match[str] | None:
    for candidate in BRACKETS.finditer(source):
        if len(QUOTED.findall(candidate.group(0))) >= MIN_ITEMS:
            return candidate
    return None


def items(line: str) -> list[str]:
    return [part.strip() for part in line.split(",") if part.strip()]


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


def three(output: str) -> tuple[list[str], list[str], list[str]]:
    found = [pattern.search(output) for pattern in (ALL, HOTBAR, REST)]
    for label, match in zip(("all", "hotbar", "rest"), found, strict=True):
        assert match is not None, f"expected a line of the form `{label}: a, b, c`"
    return tuple(items(match.group(1)) for match in found)  # type: ignore[return-value,union-attr]


def test_the_project_directory_exists() -> None:
    assert PROJECT.is_dir(), "expected a directory called the-hotbar at the top of your repository"


def test_the_program_is_in_it() -> None:
    assert SCRIPT.is_file(), "expected the-hotbar/hotbar.py"


def test_it_runs_cleanly() -> None:
    assert run(SCRIPT, PROJECT).strip(), "hotbar.py ran and printed nothing"


def test_the_inventory_is_big_enough_to_have_a_rest() -> None:
    everything, _, _ = three(run(SCRIPT, PROJECT))
    assert len(everything) >= MIN_ITEMS, (
        f"`all:` holds {len(everything)} things; the brief asks for at least {MIN_ITEMS}, so "
        f"that there is something left over after the first {HOTBAR_SIZE}"
    )


def test_the_hotbar_is_the_first_nine() -> None:
    everything, hotbar, _ = three(run(SCRIPT, PROJECT))
    expected = everything[:HOTBAR_SIZE]
    assert hotbar == expected, (
        f"`hotbar:` holds {len(hotbar)} things and should hold {len(expected)}. A slice stops "
        f"BEFORE its second number, so [0:{HOTBAR_SIZE}] is slots 0 to {HOTBAR_SIZE - 1}. "
        f"Expected {expected}, got {hotbar}."
    )


def test_the_rest_is_everything_after_them() -> None:
    everything, _, rest = three(run(SCRIPT, PROJECT))
    expected = everything[HOTBAR_SIZE:]
    assert rest == expected, f"`rest:` should be {expected}, got {rest}"


def test_the_two_halves_reassemble_into_the_whole() -> None:
    """Nothing lost, nothing duplicated, order kept."""
    everything, hotbar, rest = three(run(SCRIPT, PROJECT))
    assert hotbar + rest == everything, (
        f"`hotbar:` and `rest:` together come to {hotbar + rest}, which is not `all:` "
        f"({everything}). One of the two boundaries is off."
    )


def literal_of(source: str) -> re.Match[str]:
    literal = find_list_literal(source)
    assert literal is not None, (
        f"could not find a list of at least {MIN_ITEMS} quoted items in hotbar.py. If your "
        "inventory is built some other way, say so in NOTES.md and ask for a sign-off."
    )
    return literal


def run_edited(source: str) -> tuple[list[str], list[str], list[str]]:
    """Run a modified copy of their program. Nothing here writes to their repository."""
    with tempfile.TemporaryDirectory() as scratch:
        copy_dir = pathlib.Path(scratch)
        for entry in PROJECT.iterdir():
            if entry.is_file():
                shutil.copy2(entry, copy_dir / entry.name)
        copied = copy_dir / SCRIPT.name
        copied.write_text(source, encoding="utf-8")
        return three(run(copied, copy_dir))


def test_the_hotbar_follows_when_the_FRONT_of_the_list_changes() -> None:
    """A hotbar typed out by hand survives items being added to the END, because a literal
    does not change either -- which is exactly what the growth check below asserts of a
    correct one. The two are told apart here instead, by changing the first item: a slice
    follows, and a list of nine typed words does not.

    This was found by seeding it. The growth check alone passed a hardcoded hotbar.
    """
    source = SCRIPT.read_text(encoding="utf-8")
    literal = literal_of(source)
    inside = literal.group(0)
    first = QUOTED.search(inside)
    assert first is not None, "expected quoted items in the inventory list"

    renamed = inside[: first.start()] + '"MOVED-TO-THE-FRONT"' + inside[first.end() :]
    everything, hotbar, _ = run_edited(source[: literal.start()] + renamed + source[literal.end() :])

    assert everything[0] == "MOVED-TO-THE-FRONT", (
        "renaming the first item did not change `all:`, so that line is not the list"
    )
    assert hotbar[0] == "MOVED-TO-THE-FRONT", (
        f"the first item of the list was renamed and `hotbar:` still starts with "
        f"{hotbar[0]!r}. The hotbar is being typed out rather than taken from the list."
    )


def test_both_halves_follow_when_the_list_grows() -> None:
    """The quest, asserted. Three more items, and only one half may move.

    Runs against a copy: nothing here writes to their repository.
    """
    source = SCRIPT.read_text(encoding="utf-8")
    literal = literal_of(source)

    added = "".join(f', "GROWN-{n}"' for n in range(GROWN_BY))
    grown = source[: literal.end() - 1].rstrip().rstrip(",") + added + "]" + source[literal.end() :]

    before = three(run(SCRIPT, PROJECT))
    after = run_edited(grown)

    all_before, hotbar_before, rest_before = before
    all_after, hotbar_after, rest_after = after

    assert len(all_after) == len(all_before) + GROWN_BY, (
        f"{GROWN_BY} more items went in, and `all:` printed {len(all_after)} where it printed "
        f"{len(all_before)} before. That line is not coming from the list."
    )
    assert hotbar_after == hotbar_before, (
        f"`hotbar:` changed when items were added to the END of the list. It was "
        f"{hotbar_before} and is now {hotbar_after}. The first nine did not move."
    )
    assert len(rest_after) == len(rest_before) + GROWN_BY, (
        f"`rest:` held {len(rest_before)} and should now hold {len(rest_before) + GROWN_BY}, "
        f"but it holds {len(rest_after)}. It was typed rather than sliced."
    )


def test_the_notes_state_the_stopping_rule() -> None:
    assert NOTES.is_file(), "expected the-hotbar/NOTES.md"
    written = NOTES.read_text(encoding="utf-8").strip()
    assert len(written) >= MIN_NOTES_CHARACTERS, (
        "NOTES.md is too short. Three sentences: why [0:9] gives nine, what [9:] gives you on "
        "a short list, and the difference between inventory[:] and inventory."
    )
