"""Run every Area 0 exercise and check it does what its header says it does.

This exists because "the exercises work" is a claim, and a claim with no command
behind it is worth nothing. Run this after editing anything in exercises/.

    py -3.14 verify.py

Every exercise file carries three header tags:

    # concepts: print, variables      ids from packages/content/src/concepts.ts
    # dc: 8                           spec 5.1 Difficulty Class
    # expect: ok                      or `runs`, or the name of an error
    # stdin: Alex | 300               optional, answers fed to input()

A file tagged `expect: ok` must exit cleanly AND actually draw something.
A file tagged `expect: runs` must exit cleanly and is allowed to draw nothing --
only the blank starter is entitled to that.
A file tagged with an error name must fail with exactly that error.
Both halves matter: spec principle 5 is never hide failure, and an exercise
that was supposed to break and did not is as wrong as one that crashed.

Turtle windows are suppressed here by replacing turtle.done() with a no-op, so
this runs unattended. It does not check that the picture is BEAUTIFUL, only that
the program drew one. A human still has to look.
"""

import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).parent
SEARCH = (ROOT / "practices", ROOT / "reference")

# Mirrors the area-0 entries of packages/content/src/concepts.ts. Kept here as a
# literal on purpose: this directory must stay runnable with nothing but Python,
# and reaching into a TypeScript file to check a tag would break that.
# If concepts.ts changes, this changes. The overlap is ten strings and is worth
# the duplication.
#
# `git-clone` is Practice 0's and no drill file carries it -- that practice happens to the
# machine rather than in a file. It is listed anyway, because the check this set backs is
# "is this tag a real Area 0 concept", and a tag being unreachable today is not the same as
# it being wrong tomorrow.
AREA_0_CONCEPTS = frozenset(
    [
        "print",
        "variables",
        "int",
        "float",
        "str",
        "bool",
        "input",
        "f-strings",
        "reading-errors",
        "git-clone",
    ]
)

# Runs inside the child process, in place of the exercise's own turtle.done().
BOOTSTRAP = """
import sys, runpy, turtle

# Counting what the pen actually laid down. The number of items on the Tk canvas
# is NOT a measure of this -- a turtle that has drawn nothing at all still puts
# four items there, because the cursor is itself a drawing. Counting pen-down
# moves is the honest measure, and it was worth checking rather than assuming.
strokes = [0]

_goto = turtle.RawTurtle._goto
def counting_goto(self, end):
    if self._drawing and tuple(self._position) != tuple(end):
        strokes[0] += 1
    return _goto(self, end)
turtle.RawTurtle._goto = counting_goto

_write = turtle.RawTurtle.write
def counting_write(self, *a, **k):
    strokes[0] += 1
    return _write(self, *a, **k)
turtle.RawTurtle.write = counting_write

turtle.done = lambda *a, **k: None
turtle.mainloop = lambda *a, **k: None
turtle.exitonclick = lambda *a, **k: None

runpy.run_path(sys.argv[1], run_name="__main__")
print("__STROKES__", strokes[0])
"""


def tag(text, name):
    found = re.search(rf"^#\s*{name}:\s*(.+)$", text, re.MULTILINE)
    return found.group(1).strip() if found else None


def check(path):
    text = path.read_text(encoding="utf-8")
    expect = tag(text, "expect")
    if expect is None:
        return False, "no `# expect:` tag"

    tagged = tag(text, "concepts")
    if tagged is None:
        return False, "no `# concepts:` tag"
    named = [c.strip() for c in tagged.split(",")]
    unknown = [c for c in named if c not in AREA_0_CONCEPTS]
    if unknown:
        # Either a typo, or vocabulary from an area not yet reached. Both are
        # authoring bugs and both are silent without this check.
        return False, f"concepts not in the Area 0 registry: {unknown}"

    fed = tag(text, "stdin")
    stdin = "".join(a.strip() + "\n" for a in fed.split("|")) if fed else ""

    done = subprocess.run(
        [sys.executable, "-c", BOOTSTRAP, str(path)],
        input=stdin,
        capture_output=True,
        text=True,
        timeout=60,
        # Explicit, because half these exercises are SUPPOSED to exit non-zero. Letting
        # `check` default would raise on exactly the files this harness exists to run.
        check=False,
    )
    out, err = done.stdout, done.stderr

    if expect in ("ok", "runs"):
        if done.returncode != 0:
            return False, "expected a clean run, got:" + chr(10) + err.strip()[-400:]
        marks = re.search(r"__STROKES__ (-?\d+)", out)
        drawn = int(marks.group(1)) if marks else -1
        if expect == "ok" and drawn < 1:
            return False, "ran clean but the pen never touched the page"
        return True, f"clean, {drawn} strokes drawn"

    if done.returncode == 0:
        return False, f"expected {expect}, but it ran without complaint"
    if expect not in err:
        return False, f"expected {expect}, got:\n" + err.strip()[-400:]
    headline = [ln for ln in err.strip().splitlines() if ln.startswith(expect)]
    # The line number is reported because reference/practice-3-answers.md quotes
    # these tracebacks verbatim, and editing a docstring silently shifts them.
    # Drift there is invisible until the DM reads the wrong number aloud.
    # Match only frames naming THIS file -- the harness's own frame is in there too.
    at = [
        ln for ln in err.splitlines()
        if path.name in ln and ", line " in ln
    ]
    where = ""
    if at:
        number = at[-1].split(", line ")[1].split(",")[0].strip()
        where = f" (line {number})"
    return True, (headline[-1] if headline else expect) + where


def main() -> int:
    # `reference/` is the DM's copy and is deliberately absent from a learner's machine --
    # reference/README.md opens with "This directory is yours, not the learner's."
    #
    # `rglob` on a directory that does not exist yields nothing rather than raising, so without
    # this guard the harness printed "15 of 15 exercises behaved as tagged" and exited 0 on a
    # machine where four files were never looked at. A smaller number presented as a whole one
    # is the failure practices/README.md already names: a harness that quietly counts fewer
    # files and prints a reassuring result is worse than one that says what it cannot check.
    #
    # An absent reference/ is a CORRECT state, so this names the gap and still exits on the
    # strength of what it did run.
    absent = [d for d in SEARCH if not d.exists()]
    files = sorted(f for d in SEARCH if d.exists() for f in d.rglob("*.py"))
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
        mark = "PASS" if ok else "FAIL"
        if not ok:
            failures += 1
        print(f"  {mark}  {path.name:<28} {note}")

    print(f"\n{len(files) - failures} of {len(files)} exercises behaved as tagged.")
    for directory in absent:
        print(f"{directory.name}/ is not here, so nothing in it was checked.")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
