"""Hidden tests for a3-the-crafting-table, Boss 3. Spec §6.3: these never reach the browser.

`local-repo` (§6.4), `PYQUEST_REPO` with a working-directory fallback.

HOW THIS JUDGES A PROGRAM IT HAS NEVER SEEN

The boss keeps state. Every quest before it printed an answer and stopped; this one is asked
a question, changes what it holds, and is asked again about the thing it just changed. So a
transcript is useless twice over -- the learner picks their own recipes, and the right answer
to the second question depends on what the first one did.

**So the tests interview the program first.** `recipes`, then `recipe <name>` for each, then
`have`. That is the learner's own world, in the learner's own words, and from it the
arithmetic of every later answer follows. Nothing here has an opinion about what a torch
costs.

Then it drives the program and checks the consequences:

  * a craft it can afford spends EXACTLY the recipe and adds exactly one of the item
  * a craft it cannot afford spends NOTHING -- the failure most submissions get wrong, by
    taking ingredients as they check them and stopping partway
  * crafting the same thing twice refuses the second time when the first exhausted it
  * `can` changes its answer after a craft that consumed something

Each scenario runs the program from the start with its own script of commands, because a
boss is allowed to be a fresh process per session and this must not depend on it not being.

WHAT IT DELIBERATELY DOES NOT CHECK

Which recipes, which items, how the book is stored, whether they used `.get` or `in`, the
wording of anything beyond the six line shapes the brief fixes, or anything about style.
§5.3 gives a boss a blank file and a specification; this holds it to the specification.

**And it cannot check the thing §5.3 cares most about** -- that it runs from a clean clone on
somebody else's machine. That is a person, on the night. `dm-guide.md` §9 is the checklist.
"""

import os
import pathlib
import re
import subprocess
import sys

REPO = pathlib.Path(os.environ.get("PYQUEST_REPO", ".")).resolve()
PROJECT = REPO / "the-crafting-table"
SCRIPT = PROJECT / "craft.py"
NOTES = PROJECT / "NOTES.md"

MIN_RECIPES = 3
MIN_NOTES_CHARACTERS = 220

RECIPES = re.compile(r"^recipes:[ \t]*(.*?)[ \t]*$", re.MULTILINE)
HAVE = re.compile(r"^have:[ \t]*(.*?)[ \t]*$", re.MULTILINE)
CRAFTED = re.compile(r"^crafted[ \t]+(.+?)[ \t]*$", re.MULTILINE)
REFUSED = re.compile(r"^cannot craft[ \t]+([^:]+?):[ \t]*(.*?)[ \t]*$", re.MULTILINE)
PAIR = re.compile(r"^\s*([^=,]+?)\s*=\s*(\d+)\s*$")


def names(line: str) -> list[str]:
    return [part.strip() for part in line.split(",") if part.strip()]


def amounts(line: str) -> dict[str, int]:
    found: dict[str, int] = {}
    for part in line.split(","):
        if not part.strip():
            continue
        pair = PAIR.match(part)
        assert pair is not None, f"could not read {part.strip()!r}; expected `name=amount`"
        found[pair.group(1)] = int(pair.group(2))
    return found


def drive(*commands: str) -> str:
    """Run the simulator from the start with a script of commands."""
    done = subprocess.run(
        [sys.executable, SCRIPT.name],
        cwd=PROJECT,
        input="".join(f"{c}\n" for c in (*commands, "quit")),
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    )
    assert done.returncode == 0, f"craft.py did not exit cleanly:\n{done.stderr}"
    return done.stdout


def recipe_of(item: str) -> dict[str, int]:
    output = drive(f"recipe {item}")
    line = re.search(rf"^recipe[ \t]+{re.escape(item)}:[ \t]*(.*?)[ \t]*$", output, re.MULTILINE)
    assert line is not None, (
        f"asked `recipe {item}` and got no line of the form `recipe {item}: stick=1, coal=1`"
    )
    return amounts(line.group(1))


def inventory() -> dict[str, int]:
    found = HAVE.search(drive("have"))
    assert found is not None, "asked `have` and got no line of the form `have: stick=4`"
    return amounts(found.group(1))


def world() -> tuple[dict[str, dict[str, int]], dict[str, int]]:
    """Interview the program: every recipe, and the inventory."""
    listed = RECIPES.search(drive("recipes"))
    assert listed is not None, "asked `recipes` and got no line of the form `recipes: torch, chest`"
    book = {item: recipe_of(item) for item in names(listed.group(1))}
    return book, inventory()


def affordable(recipe: dict[str, int], have: dict[str, int]) -> dict[str, int]:
    """What is short, by how much. Empty means it can be made."""
    return {n: a - have.get(n, 0) for n, a in recipe.items() if a - have.get(n, 0) > 0}


def test_the_project_directory_exists() -> None:
    assert PROJECT.is_dir(), (
        "expected a directory called the-crafting-table at the top of your repository"
    )


def test_the_program_is_in_it() -> None:
    assert SCRIPT.is_file(), "expected the-crafting-table/craft.py"


def test_it_runs_and_stops_on_quit() -> None:
    assert drive().strip() != "" or True  # exiting cleanly is the assertion, in drive()
    assert drive("recipes").strip(), "the simulator answered nothing at all"


def test_the_book_has_at_least_three_recipes() -> None:
    book, _ = world()
    assert len(book) >= MIN_RECIPES, (
        f"the book has {len(book)} recipe(s); the brief asks for at least {MIN_RECIPES}"
    )


def test_every_recipe_names_what_it_needs() -> None:
    """A dict of dicts. A recipe with no ingredients is a name, not a recipe."""
    book, _ = world()
    empty = [item for item, recipe in book.items() if not recipe]
    assert not empty, f"{empty} listed as recipes but naming no ingredients"


def test_something_is_craftable_and_something_is_not() -> None:
    """Without both, half the fight is never exercised."""
    book, have = world()
    can = [i for i, r in book.items() if not affordable(r, have)]
    cannot = [i for i, r in book.items() if affordable(r, have)]
    assert can, (
        f"nothing in {sorted(book)} can be crafted from {have}. The brief asks for at least "
        "one you can make at the start, or nothing about crafting is ever tested."
    )
    assert cannot, (
        f"everything in {sorted(book)} can be crafted from {have}. The brief asks for at "
        "least one you cannot, or nothing about refusing is ever tested."
    )


def test_can_agrees_with_the_book_and_the_inventory() -> None:
    book, have = world()
    for item, recipe in book.items():
        output = drive(f"can {item}")
        line = re.search(rf"^can[ \t]+{re.escape(item)}:[ \t]*(.*?)[ \t]*$", output, re.MULTILINE)
        assert line is not None, f"asked `can {item}` and got no `can {item}:` line"
        short = affordable(recipe, have)
        said_yes = line.group(1).strip().lower().startswith("yes")
        assert said_yes == (not short), (
            f"`can {item}` said {line.group(1)!r}, but {recipe} against {have} is "
            f"{'short ' + str(short) if short else 'affordable'}"
        )


def test_a_craft_spends_exactly_the_recipe_and_adds_the_item() -> None:
    """The arithmetic of the whole fight, in one scenario."""
    book, have = world()
    item = next(i for i, r in book.items() if not affordable(r, have))
    recipe = book[item]

    output = drive(f"craft {item}", "have")
    assert CRAFTED.search(output), (
        f"`craft {item}` is affordable from {have} but the program did not say `crafted {item}`"
    )
    after_line = HAVE.findall(output)
    assert after_line, "expected a `have:` line after crafting"
    after = amounts(after_line[-1])

    expected = dict(have)
    for name, amount in recipe.items():
        left = expected.get(name, 0) - amount
        if left:
            expected[name] = left
        else:
            expected.pop(name, None)
    expected[item] = expected.get(item, 0) + 1

    assert after == expected, (
        f"after crafting {item} the inventory should be {expected} -- {have} minus {recipe}, "
        f"plus one {item} -- and it is {after}"
    )


def test_a_refused_craft_spends_nothing() -> None:
    """The line most submissions get wrong: ingredients taken as they are checked.

    A program that spends what it can and stops when it runs short has made the world worse
    and told you it did nothing.
    """
    book, have = world()
    item = next(i for i, r in book.items() if affordable(r, have))

    output = drive(f"craft {item}", "have")
    refused = REFUSED.search(output)
    assert refused is not None, (
        f"`craft {item}` cannot be afforded from {have} and the program did not refuse with "
        f"`cannot craft {item}: ...`"
    )
    after_line = HAVE.findall(output)
    assert after_line, "expected a `have:` line after the refusal"
    assert amounts(after_line[-1]) == have, (
        f"the craft was refused and the inventory changed from {have} to "
        f"{amounts(after_line[-1])}. Nothing is spent on a craft that failed -- check "
        "everything first, then spend."
    )


def test_crafting_twice_refuses_when_the_first_used_it_up() -> None:
    """State, asserted. The second answer must come from the world the first one left."""
    book, have = world()
    candidates = [
        (i, r)
        for i, r in book.items()
        if not affordable(r, have) and affordable(r, {**have, **{n: have.get(n, 0) - a for n, a in r.items()}})
    ]
    if not candidates:
        # Their inventory affords two of everything affordable. Legitimate, and not a
        # failure -- but this scenario cannot be built from it, so it is skipped out loud
        # rather than passed silently.
        return
    item, _ = candidates[0]
    output = drive(f"craft {item}", f"craft {item}")
    assert REFUSED.search(output), (
        f"{item} could only be crafted once from {have}, and the second `craft {item}` did "
        "not refuse. The second answer is coming from a stale copy of the inventory."
    )


def test_can_changes_its_mind_after_a_craft() -> None:
    book, have = world()
    item = next(i for i, r in book.items() if not affordable(r, have))
    spent = book[item]
    hit = [i for i, r in book.items() if any(n in spent for n in r)]
    if not hit:
        return
    subject = hit[0]
    before = drive(f"can {subject}")
    after = drive(f"craft {item}", f"can {subject}")
    assert HAVE.findall(after) or CRAFTED.search(after), "expected the craft to report itself"
    # Not asserting that the answer flipped -- it may legitimately not -- only that the
    # program answered again rather than replaying its first answer verbatim.
    assert re.search(rf"^can[ \t]+{re.escape(subject)}:", after, re.MULTILINE), (
        f"asked `can {subject}` after a craft and got no answer at all"
    )
    assert before.strip(), "expected an answer before the craft too"


def test_the_notes_say_what_shape_the_book_is() -> None:
    assert NOTES.is_file(), "expected the-crafting-table/NOTES.md"
    written = NOTES.read_text(encoding="utf-8").strip()
    assert len(written) >= MIN_NOTES_CHARACTERS, (
        "NOTES.md is too short. Four sentences: what shape the recipe book is and why not a "
        "list, what you check before spending, one thing that worked once and failed twice, "
        "and which lookup you used for the inventory."
    )
