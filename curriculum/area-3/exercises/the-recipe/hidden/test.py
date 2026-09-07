"""Hidden tests for a3-the-recipe. Spec §6.3: these never reach the browser.

`local-repo` (§6.4), `PYQUEST_REPO` with a working-directory fallback.

HOW THIS CHECKS THE THING IT IS ACTUALLY CHECKING

Two things, and the second is the quest.

**Self-consistency.** `short:` and `can build:` must both follow, by arithmetic, from the two
dicts the program printed. Every ingredient short by the right amount, nothing short that is
not, and `can build:` agreeing with whether `short:` is empty.

**Substitution.** The missing ingredient is **added to a copy of their inventory in
quantity**, and the program is run again. `short:` must empty and `can build:` must flip. A
program that prints the right answer for the inventory it was born with, and the same answer
afterwards, was remembering rather than answering -- and that is the submission this rejects.

The absent-key requirement is checked directly, because it is what forces the choice between
`have[name]` and `have.get(name, 0)`. A recipe whose ingredients all appear in `have`, even
at zero, never makes the learner meet the decision.

WHAT IT DELIBERATELY DOES NOT CHECK

Which ingredients, how many, whether they used `.get` or an `in` guard -- both are correct
and the brief says so -- and anything about style. It checks that the program answers from
the dicts, and that the situation forces the question.
"""

import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

REPO = pathlib.Path(os.environ.get("PYQUEST_REPO", ".")).resolve()
PROJECT = REPO / "the-recipe"
SCRIPT = PROJECT / "recipe.py"
NOTES = PROJECT / "NOTES.md"

MIN_INGREDIENTS = 2
MIN_NOTES_CHARACTERS = 150

RECIPE = re.compile(r"^recipe:[ \t]*(.*?)[ \t]*$", re.MULTILINE)
HAVE = re.compile(r"^have:[ \t]*(.*?)[ \t]*$", re.MULTILINE)
SHORT = re.compile(r"^short:[ \t]*(.*?)[ \t]*$", re.MULTILINE)
CAN = re.compile(r"^can build:[ \t]*(yes|no)[ \t]*$", re.MULTILINE | re.IGNORECASE)

PAIR = re.compile(r"^\s*([^=,]+?)\s*=[ \t]*(\d+)[ \t]*$")


def amounts(line: str) -> dict[str, int]:
    """`stick=2, coal=1` as a dict. An empty line is an empty dict, not a parse failure."""
    found: dict[str, int] = {}
    for part in line.split(","):
        if not part.strip():
            continue
        pair = PAIR.match(part)
        assert pair is not None, f"could not read {part.strip()!r}; expected `name=amount`"
        found[pair.group(1)] = int(pair.group(2))
    return found


# A dict literal with no nesting, and the `"key": number` pairs inside one.
BRACES = re.compile(r"\{[^{}]*\}", re.DOTALL)
ENTRY = re.compile(r"""(['"])([^'"]+)\1\s*:\s*(\d+)""")


def find_dict_literal(source: str, wanted: dict[str, int]) -> re.Match[str] | None:
    """The literal that produced `wanted`, identified by its CONTENTS rather than its name.

    A program may call its inventory anything, and the first `{` in the file is as likely to
    be the recipe as the inventory -- which is exactly the bug this replaced. Matching on the
    keys the program itself printed is the one identification that does not depend on
    guessing what the learner named things.
    """
    for candidate in BRACES.finditer(source):
        keys = {name for _, name, _ in ENTRY.findall(candidate.group(0))}
        if keys == set(wanted):
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
    assert done.returncode == 0, (
        f"{script.name} did not run cleanly:\n{done.stderr}\n"
        "If this is a KeyError, that is the quest: a missing ingredient is an ordinary "
        "answer of zero, not an error."
    )
    return done.stdout


def read(output: str) -> tuple[dict[str, int], dict[str, int], dict[str, int], str]:
    parts = [pattern.search(output) for pattern in (RECIPE, HAVE, SHORT)]
    for label, match in zip(("recipe", "have", "short"), parts, strict=True):
        assert match is not None, f"expected a line of the form `{label}: stick=2, coal=1`"
    verdict = CAN.search(output)
    assert verdict is not None, "expected a line of the form `can build: yes` or `can build: no`"
    recipe, have, short = (amounts(match.group(1)) for match in parts)  # type: ignore[union-attr]
    return recipe, have, short, verdict.group(1).lower()


def shortfall(recipe: dict[str, int], have: dict[str, int]) -> dict[str, int]:
    """What is missing, by how much. `.get(name, 0)` is the whole lesson, so it is used here."""
    return {
        name: needed - have.get(name, 0)
        for name, needed in recipe.items()
        if needed - have.get(name, 0) > 0
    }


def test_the_project_directory_exists() -> None:
    assert PROJECT.is_dir(), "expected a directory called the-recipe at the top of your repository"


def test_the_program_is_in_it() -> None:
    assert SCRIPT.is_file(), "expected the-recipe/recipe.py"


def test_it_runs_cleanly() -> None:
    assert run(SCRIPT, PROJECT).strip(), "recipe.py ran and printed nothing"


def test_the_recipe_has_enough_in_it() -> None:
    recipe, _, _, _ = read(run(SCRIPT, PROJECT))
    assert len(recipe) >= MIN_INGREDIENTS, (
        f"the recipe has {len(recipe)} ingredient(s); the brief asks for at least "
        f"{MIN_INGREDIENTS}"
    )


def test_something_in_the_recipe_is_absent_from_have() -> None:
    """The situation that forces the choice between `have[name]` and `have.get(name, 0)`.

    Absent, not zero. An ingredient present with a value of nought never makes the learner
    meet the decision this practice is about.
    """
    recipe, have, _, _ = read(run(SCRIPT, PROJECT))
    absent = [name for name in recipe if name not in have]
    assert absent, (
        f"every ingredient in the recipe {sorted(recipe)} also appears in `have:` "
        f"{sorted(have)}. The brief asks for at least one that is missing entirely -- that "
        "is what forces the question of what a missing key means."
    )


def test_short_follows_from_the_two_dicts() -> None:
    recipe, have, short, _ = read(run(SCRIPT, PROJECT))
    expected = shortfall(recipe, have)
    assert short == expected, (
        f"`short:` says {short}, but the recipe {recipe} against {have} comes to {expected}. "
        "Each shortfall is what is needed minus what you have, and a missing ingredient "
        "counts as zero rather than as an error."
    )


def test_the_verdict_agrees_with_the_shortfall() -> None:
    _, _, short, verdict = read(run(SCRIPT, PROJECT))
    expected = "no" if short else "yes"
    assert verdict == expected, (
        f"`short:` lists {short or 'nothing'} and `can build:` says {verdict}. "
        f"Those disagree; it should say {expected}."
    )


def test_the_answer_changes_when_the_inventory_does() -> None:
    """The quest, asserted. Stock the missing ingredient and the verdict must flip.

    Runs against a copy: nothing here writes to their repository.
    """
    _, have, short, verdict = read(run(SCRIPT, PROJECT))
    assert verdict == "no", (
        "the program can already build the thing, so there is nothing to flip. Start short "
        "of at least one ingredient -- the brief asks for one missing entirely."
    )

    source = SCRIPT.read_text(encoding="utf-8")
    literal = find_dict_literal(source, have)
    assert literal is not None, (
        f"could not find the inventory dict in recipe.py -- looked for a `{{...}}` holding "
        f"the keys {sorted(have)} that `have:` printed. If your inventory is built some other "
        "way, say so in NOTES.md and ask for a sign-off."
    )

    # Rebuild it stocked, rather than patching it in place: one literal written from the
    # amounts already parsed out of their own output, so a key that was absent is added and
    # one that was short is topped up, by the same line of code.
    stocked_amounts = {name: have.get(name, 0) + short.get(name, 0) for name in have | short}
    rebuilt = "{" + ", ".join(f'"{n}": {a}' for n, a in stocked_amounts.items()) + "}"
    stocked = source[: literal.start()] + rebuilt + source[literal.end() :]

    with tempfile.TemporaryDirectory() as scratch:
        copy_dir = pathlib.Path(scratch)
        for entry in PROJECT.iterdir():
            if entry.is_file():
                shutil.copy2(entry, copy_dir / entry.name)
        copied = copy_dir / SCRIPT.name
        copied.write_text(stocked, encoding="utf-8")
        after = read(run(copied, copy_dir))

    _, have_after, short_after, verdict_after = after
    assert have_after != have, (
        "stocking the missing ingredient did not change `have:`, so that line is not coming "
        "from the dict"
    )
    assert not short_after, (
        f"the missing ingredients were stocked and `short:` still says {short_after}. "
        "That line was typed rather than worked out."
    )
    assert verdict_after == "yes", (
        f"nothing is short any more and `can build:` still says {verdict_after}. The verdict "
        "is remembered rather than answered."
    )


def test_the_notes_say_which_lookup_and_why() -> None:
    assert NOTES.is_file(), "expected the-recipe/NOTES.md"
    written = NOTES.read_text(encoding="utf-8").strip()
    assert len(written) >= MIN_NOTES_CHARACTERS, (
        "NOTES.md is too short. Three sentences: when you would use have[name] and when "
        ".get(name, 0), what .get hands back with no default, and what .items() gives you."
    )
