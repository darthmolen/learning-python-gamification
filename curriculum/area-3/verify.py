"""Run every Area 3 exercise and check it does what its header says it does.

    py -3.14 verify.py

**This harness never opens a window, and that is the design rather than a
convenience.** Area 3's vehicle is Ursina behind the `world` shim, and
`world.start()` ends in `app.run()`, which builds an OpenGL context and blocks
forever. So `start` is replaced with a recording stand-in *before* the exercise
is imported, and the exercise then places its blocks into `world.placed` and
"starts" a world that is never built. What gets asserted is the placement
record, not pixels.

Two things follow from that, and both are deliberate:

  * **The file the learner runs is the file this runs.** No exercise is written
    with a harness entry point, no exercise is edited to be testable, and every
    one of them ships the same `start()` call they type. Area 0's harness earned
    that rule the hard way: an exercise shaped to be checked stops looking like
    the thing a learner writes.
  * **Nothing steals focus.** Areas 0 and 1 draw with turtle, so verifying them
    opens and closes fifty Tk windows. Nothing here maps a window at all.

Every exercise carries three header tags, and may carry three more:

    # concepts: list, indexing      ids from packages/content/src/concepts.ts
    # dc: 12                        spec 5.1 Difficulty Class
    # expect: ok                    or `runs`, or the name of an error
    # stdin: torch | 3              optional, answers fed to input()
    # min-blocks: 10                optional, default 0: the fewest blocks placed
    # timeout-seconds: 45           optional, default 30

  `expect: ok`     must exit cleanly AND do something observable -- print
                   something, or place at least one block. A file that runs and
                   leaves no trace has not been shown to work.
  `expect: runs`   must exit cleanly; leaving no trace is allowed.
  `expect: Name`   must fail with exactly that error.

Both directions matter. Spec principle 5 is never hide failure, and an exercise
that was supposed to break and did not is as wrong as one that crashed.

WHAT THIS CHECKS THAT AREAS 0-2 DID NOT

**The block cap, asserted rather than trusted.** `curriculum/lib/README.md`
soft-caps an Area 3 world near 5,000 blocks, and the shim plan measured why on
the machine that matters: at 5,000 fused blocks the laptop holds 213.8 fps but
takes **5.32 seconds to start**, because `combine()` costs about a millisecond a
block and is paid once before anything appears. **The cap is about how long a
learner stares at a blank window, not about smoothness** -- 8,000 blocks still
renders at 178 fps. An author reading "the cap is about fps" will reason wrongly
about what they can spend, so the number is checked here rather than left to
arithmetic in a practice plan.

**`start()` called exactly once, when anything was placed.** `place()` only
remembers; `start()` is what builds. A file that places fifty blocks and never
calls `start()` runs perfectly, exits zero, and draws nothing at all -- the
quietest failure available in this area, and invisible to any check that only
asks whether the program crashed.

**No raw Ursina, anywhere.** Spec 4 measured that 9 of 9 engine-touching lines a
learner would write are vocabulary they have not earned, and the shim exists to
be a validating boundary. `Entity(`, `from ursina` and `import ursina` fail this
run wherever they appear under `practices/`, `exercises/` or `reference/`. The
match is deliberately blunt: prose in a docstring saying "never write `Entity(`"
trips it too, and it should, because the phrase has no business in an area whose
whole argument is that the learner never sees it.
"""

from __future__ import annotations

import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).parent
SEARCH = (ROOT / "practices", ROOT / "reference")
LIB = ROOT.parent / "lib"

# Every directory whose Python is subject to the raw-Ursina ban. `exercises/`
# joins the two searched directories because hidden tests are Python too, and a
# test that reached past the shim would be checking the wrong thing entirely.
NO_RAW_URSINA = (ROOT / "practices", ROOT / "exercises", ROOT / "reference")

# Mirrors the area 0-3 entries of packages/content/src/concepts.ts. Kept here as
# a literal on purpose: this directory must stay runnable with nothing but
# Python, and reaching into a TypeScript file to check a tag would break that.
# If concepts.ts changes, this changes.
#
# Four areas rather than one, because the curriculum convention is to tag what a
# file RESURFACES as well as what it introduces -- spec 5.4 schedules retrieval
# off these tags. An Area 3 file that quietly needs the accumulator pattern
# should say so, and a registry holding only Area 3 ids would reject it for
# telling the truth.
AREA_0_CONCEPTS = (
    "print", "variables", "int", "float", "str", "bool", "input", "f-strings",
    "reading-errors",
)
AREA_1_CONCEPTS = (
    "if", "elif", "else", "comparison-operators", "boolean-operators", "while",
    "for", "range", "nesting", "accumulator-pattern",
)
AREA_2_CONCEPTS = (
    "repository", "git-init", "git-add", "git-commit", "git-log", "git-branch",
    "git-push", "files-on-disk", "running-scripts", "vscode", "venv", "pip",
    "tracebacks", "main-guard",
)
AREA_3_CONCEPTS = (
    "list", "indexing", "slicing", "mutation", "list-methods", "tuple", "dict",
    "dict-methods", "set", "iteration", "nested-structures", "len", "in",
    "sorted", "min", "max", "breakpoints",
)
KNOWN_CONCEPTS = frozenset(
    AREA_0_CONCEPTS + AREA_1_CONCEPTS + AREA_2_CONCEPTS + AREA_3_CONCEPTS
)

# Spec 5.1's Difficulty Class scale. Area 3's own band is 10-24 and is argued in
# README.md; this is the wider scale a tag has to be on at all, which is what a
# harness can honestly check.
MIN_DC = 5
MAX_DC = 30

# curriculum/lib/README.md, and the shim plan's measurement on the target
# laptop. Startup cost, not framerate, is what this protects.
BLOCK_CAP = 5000

# `import world` pulls in ursina and costs about three quarters of a second, so
# the floor is higher than Area 1's ten.
DEFAULT_TIMEOUT_SECONDS = 30

# The floor when a file does not carry `# min-blocks:`. Zero, because plenty of
# Area 3 exercises are about a list and never place anything at all.
DEFAULT_MIN_BLOCKS = 0

RAW_URSINA = (
    ("Entity(", re.compile(r"\bEntity\s*\(")),
    ("from ursina", re.compile(r"^\s*from\s+ursina\b", re.MULTILINE)),
    ("import ursina", re.compile(r"^\s*import\s+ursina\b", re.MULTILINE)),
)

# Runs inside the child process. `world.start` is replaced BEFORE the exercise is
# imported, which is the whole trick and is order-dependent: an exercise's
# `from world import place, start` binds whatever `world.start` is at the moment
# it runs, so patching afterwards would bind the real one and block forever.
BOOTSTRAP = """
import runpy
import sys

sys.path.insert(0, sys.argv[2])
import world

started = [0]


def recording_stub(*args, **kwargs):
    started[0] += 1


world.start = recording_stub

runpy.run_path(sys.argv[1], run_name="__main__")

print("__PLACED__", len(world.placed))
print("__STARTED__", started[0])
print("__KINDS__", ",".join(sorted({spot[3] for spot in world.placed})))
"""

MARKERS = ("__PLACED__", "__STARTED__", "__KINDS__")


def tag(text: str, name: str) -> str | None:
    """The value of a `# <name>:` header tag, or None if the file has none."""
    found = re.search(rf"^#\s*{name}:\s*(.+)$", text, re.MULTILINE)
    return found.group(1).strip() if found else None


def number_tag(text: str, name: str, fallback: int) -> int:
    """A `# name: N` tag read as a whole number, or `fallback` if absent.

    Anything after the number is a note to whoever reads the file and is
    ignored, because a tag that says why it is 10 is worth more than one that
    says 10.
    """
    declared = tag(text, name)
    return int(declared.split()[0]) if declared else fallback


def check_tags(text: str) -> str | None:
    """The first thing wrong with this file's header, or None if it is sound."""
    tagged = tag(text, "concepts")
    if tagged is None:
        return "no `# concepts:` tag"
    named = [c.strip() for c in tagged.split(",")]
    unknown = [c for c in named if c not in KNOWN_CONCEPTS]
    if unknown:
        # Either a typo, or vocabulary from an area not yet reached. Both are
        # authoring bugs, and both are silent without this check.
        return f"concepts not in the areas 0-3 registry: {unknown}"

    difficulty = tag(text, "dc")
    if difficulty is None:
        return "no `# dc:` tag"
    if not difficulty.isdigit():
        return f"`# dc:` is not a whole number: {difficulty!r}"
    if not MIN_DC <= int(difficulty) <= MAX_DC:
        return f"`# dc: {difficulty}` is off the {MIN_DC}-{MAX_DC} scale (spec 5.1)"

    if tag(text, "expect") is None:
        return "no `# expect:` tag"
    return None


def marker(stdout: str, name: str) -> str:
    """What the child reported for one marker, or an empty string if it never got there."""
    found = re.search(rf"^{name} ?(.*)$", stdout, re.MULTILINE)
    return found.group(1).strip() if found else ""


def spoken(stdout: str) -> int:
    """Characters the exercise itself printed, with this harness's markers removed."""
    said = [ln for ln in stdout.splitlines() if not ln.startswith(MARKERS)]
    return len("\n".join(said).strip())


def world_complaint(text: str, out: str) -> str | None:
    """What the placement record says is wrong, or None if it is sound."""
    placed_at = marker(out, "__PLACED__")
    if not placed_at:
        # The child never reached its own last three lines, which means the
        # exercise did not finish. The caller reports the traceback.
        return None
    placed = int(placed_at)
    started = int(marker(out, "__STARTED__") or 0)

    if placed > BLOCK_CAP:
        return (
            f"placed {placed} blocks, over the {BLOCK_CAP} cap -- "
            f"that is {placed / 1000:.1f}s of startup before anything appears"
        )

    least = number_tag(text, "min-blocks", DEFAULT_MIN_BLOCKS)
    if placed < least:
        return f"placed {placed} blocks, needs at least {least}"

    if placed and not started:
        return f"placed {placed} blocks and never called start(), so it draws nothing"
    if started > 1:
        return f"called start() {started} times; a world is built once"

    # No check that every kind is a real `BLOCKS` key, and that is not an
    # oversight. `place()` raises ValueError on an unknown kind at the moment it
    # is called, naming the seven it knows, so a bad kind can never reach the
    # placement record -- it fails the run as a crash instead. A check here would
    # be unreachable code dressed as diligence. `__KINDS__` is still reported by
    # the child because it is worth reading when a world looks wrong.
    return None


def check(path: pathlib.Path) -> tuple[bool, str]:
    """Run one exercise and say whether it behaved the way its header claims."""
    text = path.read_text(encoding="utf-8")
    complaint = check_tags(text)
    if complaint is not None:
        return False, complaint

    expect = tag(text, "expect")
    assert expect is not None  # check_tags proved this

    fed = tag(text, "stdin")
    stdin = "".join(a.strip() + "\n" for a in fed.split("|")) if fed else ""
    limit = number_tag(text, "timeout-seconds", DEFAULT_TIMEOUT_SECONDS)

    try:
        done = subprocess.run(
            [sys.executable, "-c", BOOTSTRAP, str(path), str(LIB)],
            input=stdin,
            capture_output=True,
            text=True,
            timeout=limit,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return False, f"still running after {limit}s -- waiting on an input()?"

    out, err = done.stdout, done.stderr

    if expect in ("ok", "runs"):
        if done.returncode != 0:
            return False, "expected a clean run, got:\n" + err.strip()[-400:]
        wrong = world_complaint(text, out)
        if wrong is not None:
            return False, wrong
        placed = int(marker(out, "__PLACED__") or 0)
        printed = spoken(out)
        if expect == "ok" and not printed and not placed:
            return False, "ran clean, printed nothing and placed nothing"
        return True, f"clean, {placed} blocks placed, {printed} characters printed"

    if done.returncode == 0:
        return False, f"expected {expect}, but it ran without complaint"
    if expect not in err:
        return False, f"expected {expect}, got:\n" + err.strip()[-400:]
    headline = [ln for ln in err.strip().splitlines() if ln.startswith(expect)]
    frames = [ln for ln in err.splitlines() if path.name in ln and ", line " in ln]
    where = ""
    if frames:
        where = f" (line {frames[-1].split(', line ')[1].split(',')[0].strip()})"
    return True, (headline[-1] if headline else expect) + where


def raw_ursina_hits() -> list[str]:
    """Every place the engine was reached for directly, past the shim."""
    hits = []
    for directory in NO_RAW_URSINA:
        if not directory.exists():
            continue
        for path in sorted(directory.rglob("*.py")):
            text = path.read_text(encoding="utf-8")
            for name, pattern in RAW_URSINA:
                if pattern.search(text):
                    hits.append(f"{path.relative_to(ROOT)}: {name}")
    return hits


def in_practice_order(path: pathlib.Path) -> tuple[str, int, str]:
    """Sort key that puts practice-2 before practice-10, which plain sorting does not."""
    top = path.relative_to(ROOT).parts[0]
    numbered = re.fullmatch(r"practice-(\d+)", path.parent.name)
    return (top, int(numbered.group(1)) if numbered else 0, path.name)


def main() -> int:
    files = sorted((f for d in SEARCH if d.exists() for f in d.rglob("*.py")),
                   key=in_practice_order)
    if not files:
        print("no exercises found -- that is not a pass, it is a missing tree")
        return 1

    failures = 0
    practice = None
    for path in files:
        if path.parent.name != practice:
            practice = path.parent.name
            print(f"\n{practice}")
        ok, note = check(path)
        if not ok:
            failures += 1
        print(f"  {'PASS' if ok else 'FAIL'}  {path.name:<34} {note}")

    reached = raw_ursina_hits()
    if reached:
        print("\nraw Ursina, past the shim -- spec 4 says every one of these is")
        print("vocabulary the learner has not earned:")
        for hit in reached:
            print(f"  FAIL  {hit}")

    print(f"\n{len(files) - failures} of {len(files)} exercises behaved as tagged.")
    if reached:
        print(f"{len(reached)} file(s) reached past the shim. The cap is {BLOCK_CAP} blocks.")

    # Practice 8's debugger rung is a thing done in an editor, and there is nothing in
    # "set a breakpoint and read the Variables panel" for a harness to execute. Area 2's
    # harness earned this rule: a run that silently ignores what it cannot cover is worse
    # than one that says so out loud, because the number at the bottom then means less
    # than the reader thinks. So the count is printed rather than the walkthroughs being
    # quietly skipped.
    walkthroughs = sorted(f for d in SEARCH if d.exists() for f in d.rglob("w*.md"))
    if walkthroughs:
        print(
            f"{len(walkthroughs)} walkthrough(s) are NOT covered here -- there is nothing to"
            "\nexecute in them. They are audited by a person who followed them."
        )
    return 1 if failures or reached else 0


if __name__ == "__main__":
    sys.exit(main())
