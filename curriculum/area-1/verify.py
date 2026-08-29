"""Run every Area 1 exercise and check it does what its header says it does.

This exists because "the exercises work" is a claim, and a claim with no command
behind it is worth nothing. Run this after editing anything in exercises/.

    py -3.14 verify.py

Every exercise file carries three header tags, and may carry three more:

    # concepts: for, range          ids from packages/content/src/concepts.ts
    # dc: 10                        spec 5.1 Difficulty Class
    # expect: ok                    or `runs`, `hangs`, or the name of an error
    # stdin: 7 | 90                 optional, answers fed to input()
    # min-strokes: 5                optional, default 1: the fewest pen-down moves
    # timeout-seconds: 6            optional, default 10: the wall clock for this file

A file tagged `expect: ok` must exit cleanly AND actually draw something.
A file tagged `expect: runs` must exit cleanly and is allowed to draw nothing --
only a blank starter is entitled to that.
A file tagged `expect: hangs` must NOT finish. It is killed and that is the pass
condition; a file tagged `hangs` that exits has failed.
A file tagged with an error name must fail with exactly that error.

Both halves matter: spec principle 5 is never hide failure, and an exercise that
was supposed to break and did not is as wrong as one that crashed.

Three tags here that Area 0's harness did not need, and all three exist because
Area 1's failures are quieter than Area 0's. All three are optional; a file may
carry none of them and behave exactly as it would have under Area 0's harness.

**`expect: hangs`, a new member of the existing expectation vocabulary.** Session
3 and session 6 each ship a loop that does not stop, and that loop is the lesson.
Putting it in `# expect:` rather than inventing a bare timeout number keeps one
vocabulary for "what should happen when this runs".

**`# timeout-seconds: N`, default 10.** Only a file that needs something other
than the default carries it, so thirty files do not each repeat boilerplate.

**`# min-strokes: N`, default 1** -- which is exactly Area 0's behaviour, so
nothing changes for a file that does not carry it. Non-zero is not enough in an
area whose signature bug is an off-by-one: `b1_five_of_six.py` draws five sides of
a hexagon, and a check for "did it draw anything" passes it happily. Any file
whose shape has a known stroke count carries the real number, so that a file
quietly drawing less than it should is caught here rather than in a session.

Turtle windows are suppressed by replacing turtle.done() with a no-op, so this
runs unattended. It does not check that the picture is BEAUTIFUL, only that the
program drew one. A human still has to look.
"""

from __future__ import annotations

import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).parent
SEARCH = (ROOT / "exercises", ROOT / "reference")

# Mirrors the area-0 and area-1 entries of packages/content/src/concepts.ts. Kept
# here as a literal on purpose: this directory must stay runnable with nothing but
# Python, and reaching into a TypeScript file to check a tag would break that.
# If concepts.ts changes, this changes.
#
# Area 0's nine are in the allowed set because Area 1 files resurface them
# constantly, and spec 5.4 schedules retrieval off what a file resurfaces rather
# than off what it introduces. A file that quietly needs `variables` says so.
AREA_0_CONCEPTS = frozenset({
    "print", "variables", "int", "float", "str", "bool", "input", "f-strings",
    "reading-errors",
})
AREA_1_CONCEPTS = frozenset({
    "if", "elif", "else", "comparison-operators", "boolean-operators", "while",
    "for", "range", "nesting", "accumulator-pattern",
})
ALLOWED_CONCEPTS = AREA_0_CONCEPTS | AREA_1_CONCEPTS

# Seconds, when a file does not carry `# timeout-seconds:`. The slowest legitimate
# file in this area finishes in about two, so ten is generous.
#
# It is also deliberately not much larger, because of a thing measured here rather
# than assumed: a turtle file that loops forever fills the Tk canvas until the
# window dies, the process raises `turtle.Terminator`, and the run that follows it
# can fail for want of memory. So an untagged runaway usually reports as a crash
# rather than as a timeout -- still a FAIL, still with the file's name on it -- and
# this number decides how much damage it does on the way there.
DEFAULT_TIMEOUT_SECONDS = 10

# The floor when a file does not carry `# min-strokes:`. One is Area 0's behaviour:
# a file tagged `ok` had to put the pen down at least once.
DEFAULT_MIN_STROKES = 1

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


def tag(text: str, name: str) -> str | None:
    """The value of a `# name:` header tag, or None if the file does not carry it."""
    found = re.search(rf"^#\s*{name}:\s*(.+)$", text, re.MULTILINE)
    return found.group(1).strip() if found else None


def strokes_in(stdout: str) -> int:
    """Pen-down moves the child reported, or -1 if it never got as far as saying."""
    marks = re.search(r"__STROKES__ (-?\d+)", stdout)
    return int(marks.group(1)) if marks else -1


def check_tags(text: str) -> tuple[str, str | None] | str:
    """The `expect` value and the raw `stdin` value, or a sentence about what is wrong."""
    expect = tag(text, "expect")
    if expect is None:
        return "no `# expect:` tag"

    tagged = tag(text, "concepts")
    if tagged is None:
        return "no `# concepts:` tag"
    named = [c.strip() for c in tagged.split(",")]
    unknown = [c for c in named if c not in ALLOWED_CONCEPTS]
    if unknown:
        # Either a typo, or vocabulary from an area he has not reached. Both are
        # authoring bugs and both are silent without this check.
        return f"concepts not in the Area 0-1 registry: {unknown}"

    if tag(text, "dc") is None:
        return "no `# dc:` tag"

    return expect, tag(text, "stdin")


def number_tag(text: str, name: str, fallback: int) -> int:
    """A `# name: N` header tag read as a whole number, or `fallback` if absent.

    Anything after the number is a note to whoever reads the file and is ignored,
    because a tag that says why it is 6 is worth more than a tag that says 6.
    """
    declared = tag(text, name)
    return int(declared.split()[0]) if declared else fallback


def failure_line(path: pathlib.Path, expect: str, stderr: str) -> str:
    """The reported error, with the line number in THIS file that raised it.

    The line number is reported because reference/session-6-answers.md quotes these
    tracebacks, and editing a docstring silently shifts them. Drift there is
    invisible until the parent reads the wrong number aloud. Match only frames
    naming this file -- the harness's own frame is in there too.
    """
    headline = [ln for ln in stderr.strip().splitlines() if ln.startswith(expect)]
    at = [ln for ln in stderr.splitlines() if path.name in ln and ", line " in ln]
    where = ""
    if at:
        number = at[-1].split(", line ")[1].split(",")[0].strip()
        where = f" (line {number})"
    return (headline[-1] if headline else expect) + where


def check(path: pathlib.Path) -> tuple[bool, str]:
    """Run one exercise and report whether it behaved the way its header claims."""
    text = path.read_text(encoding="utf-8")
    tags = check_tags(text)
    if isinstance(tags, str):
        return False, tags
    expect, fed = tags

    stdin = "".join(a.strip() + "\n" for a in fed.split("|")) if fed else ""
    limit = number_tag(text, "timeout-seconds", DEFAULT_TIMEOUT_SECONDS)

    try:
        done = subprocess.run(
            [sys.executable, "-c", BOOTSTRAP, str(path)],
            input=stdin,
            capture_output=True,
            text=True,
            timeout=limit,
            check=False,
        )
    except subprocess.TimeoutExpired as expired:
        if expect == "hangs":
            return True, f"still running after {limit}s, as tagged -- killed"
        raise RuntimeError(
            f"{path.name} did not finish within {limit}s and is not tagged"
            " `# expect: hangs`"
        ) from expired

    if expect == "hangs":
        return False, f"expected it never to finish, but it exited in under {limit}s"

    out, err = done.stdout, done.stderr

    if expect in ("ok", "runs"):
        if done.returncode != 0:
            return False, "expected a clean run, got:" + chr(10) + err.strip()[-400:]
        drawn = strokes_in(out)
        if expect == "runs" and tag(text, "min-strokes") is None:
            return True, f"clean, {drawn} strokes drawn"
        least = number_tag(text, "min-strokes", DEFAULT_MIN_STROKES)
        if drawn < least:
            return False, f"ran clean but drew {drawn} strokes, needs at least {least}"
        return True, f"clean, {drawn} strokes drawn (floor {least})"

    if done.returncode == 0:
        return False, f"expected {expect}, but it ran without complaint"
    if expect not in err:
        return False, f"expected {expect}, got:\n" + err.strip()[-400:]
    return True, failure_line(path, expect, err)


def in_session_order(path: pathlib.Path) -> tuple[str, int, str]:
    """Sort key that puts session-2 before session-10, which plain sorting does not."""
    top = path.relative_to(ROOT).parts[0]
    numbered = re.fullmatch(r"session-(\d+)", path.parent.name)
    return (top, int(numbered.group(1)) if numbered else 0, path.name)


def main() -> int:
    files = sorted((f for d in SEARCH for f in d.rglob("*.py")), key=in_session_order)
    if not files:
        print("no exercises found")
        return 1

    failures = 0
    session = None
    for path in files:
        if path.parent.name != session:
            session = path.parent.name
            print(f"\n{session}")
        ok, note = check(path)
        mark = "PASS" if ok else "FAIL"
        if not ok:
            failures += 1
        print(f"  {mark}  {path.name:<34} {note}")

    print(f"\n{len(files) - failures} of {len(files)} exercises behaved as tagged.")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
