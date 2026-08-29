"""Run every runnable Area 2 exercise and check it does what its header says.

    py -3.14 verify.py

**Read this paragraph before reading the number at the bottom.** Area 2 is git
and the toolchain, so most of what this area teaches is markdown walkthroughs
typed at a terminal, and there is nothing in "make a commit, then read the log"
for a harness to execute. So the count below is over the runnable `.py`
exercises ONLY, and it is deliberately small -- four, against Area 0's nineteen.
That is honest rather than thin: the walkthroughs are audited by the completion
checklist in `README.md`, one line per walkthrough, checked by a person who
followed it. A harness that silently counted zero files and printed a
reassuring `0 of 0` would be worse than one that says out loud what it does not
cover, so this one prints both numbers.

Every runnable exercise carries three header tags, exactly as in Area 0:

    # concepts: print, git-add     ids from packages/content/src/concepts.ts
    # dc: 8                        spec 5.1 Difficulty Class
    # expect: ok                   or `runs`, or the name of an error
    # stdin: the-forge | 4         optional, answers fed to input()

  `expect: ok`     must exit cleanly AND print something.
  `expect: runs`   must exit cleanly; printing nothing is allowed.
  `expect: Name`   must fail with exactly that error.

Both directions matter. Spec principle 5 is never hide failure, and an exercise
that was supposed to break and did not is as wrong as one that crashed.

No turtle here, and so no turtle bootstrap: Area 2's vehicle is the toolchain
rather than a drawing, and every runnable file in this area proves itself on
stdout. That is why this harness is half the length of Area 0's.
"""

import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).parent
SEARCH = (ROOT / "exercises", ROOT / "reference")

# Mirrors the area 0, 1 and 2 entries of packages/content/src/concepts.ts. Kept
# here as a literal on purpose: this directory must stay runnable with nothing
# but Python, and reaching into a TypeScript file to check a tag would break
# that. If concepts.ts changes, this changes.
#
# Three areas rather than one, unlike Area 0's harness, because the curriculum
# convention is to tag what a file RESURFACES as well as what it introduces
# (spec 5.4 schedules retrieval off these tags). An Area 2 file that quietly
# needs the accumulator pattern should say so, and a registry holding only Area
# 2 ids would reject it for telling the truth.
KNOWN_CONCEPTS = frozenset(
    """
    print variables int float str bool input f-strings reading-errors
    if elif else comparison-operators boolean-operators while for range
    nesting accumulator-pattern
    repository git-init git-add git-commit git-log git-branch git-push
    files-on-disk running-scripts vscode venv pip tracebacks main-guard
    """.split()
)

MIN_DC = 5
MAX_DC = 30

# The longest any exercise in this area should need. A file that hangs is a
# file waiting on an input() the `# stdin:` tag did not feed it.
TIMEOUT_SECONDS = 60


def tag(text: str, name: str) -> str | None:
    """The value of a `# <name>:` header tag, or None if the file has none."""
    found = re.search(rf"^#\s*{name}:\s*(.+)$", text, re.MULTILINE)
    return found.group(1).strip() if found else None


def check_tags(text: str) -> str | None:
    """The first thing wrong with this file's header, or None if it is sound."""
    tagged = tag(text, "concepts")
    if tagged is None:
        return "no `# concepts:` tag"
    named = [c.strip() for c in tagged.split(",")]
    unknown = [c for c in named if c not in KNOWN_CONCEPTS]
    if unknown:
        # Either a typo, or vocabulary from an area he has not reached. Both
        # are authoring bugs, and both are silent without this check.
        return f"concepts not in the areas 0-2 registry: {unknown}"

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


def failing_line(stderr: str, filename: str) -> str:
    """` (line 12)` for the last frame naming this file, or an empty string."""
    frames = [ln for ln in stderr.splitlines() if filename in ln and ", line " in ln]
    if not frames:
        return ""
    number = frames[-1].split(", line ")[1].split(",")[0].strip()
    return f" (line {number})"


def check(path: pathlib.Path) -> tuple[bool, str]:
    """Run one exercise and say whether it behaved the way its header claims."""
    text = path.read_text(encoding="utf-8")
    complaint = check_tags(text)
    if complaint is not None:
        return False, complaint

    expect = tag(text, "expect")
    assert expect is not None  # check_tags proved this

    fed = tag(text, "stdin")
    stdin = "".join(answer.strip() + "\n" for answer in fed.split("|")) if fed else ""

    try:
        done = subprocess.run(
            [sys.executable, str(path)],
            input=stdin,
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SECONDS,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return False, f"still running after {TIMEOUT_SECONDS}s -- waiting on an input()?"

    if expect in ("ok", "runs"):
        if done.returncode != 0:
            return False, "expected a clean run, got:\n" + done.stderr.strip()[-400:]
        printed = len(done.stdout.strip())
        if expect == "ok" and printed == 0:
            return False, "ran clean and printed nothing"
        return True, f"clean, {printed} characters printed"

    if done.returncode == 0:
        return False, f"expected {expect}, but it ran without complaint"
    if expect not in done.stderr:
        return False, f"expected {expect}, got:\n" + done.stderr.strip()[-400:]
    headline = [ln for ln in done.stderr.strip().splitlines() if ln.startswith(expect)]
    return True, (headline[-1] if headline else expect) + failing_line(done.stderr, path.name)


def main() -> int:
    files = sorted(f for directory in SEARCH for f in directory.rglob("*.py"))
    walkthroughs = sorted(f for directory in SEARCH for f in directory.rglob("w*.md"))
    if not files:
        print("no runnable exercises found -- that is not a pass, it is a missing tree")
        return 1

    failures = 0
    session = None
    for path in files:
        if path.parent.name != session:
            session = path.parent.name
            print(f"\n{session}")
        ok, note = check(path)
        if not ok:
            failures += 1
        print(f"  {'PASS' if ok else 'FAIL'}  {path.name:<24} {note}")

    print(f"\n{len(files) - failures} of {len(files)} runnable exercises behaved as tagged.")
    print(
        f"{len(walkthroughs)} git walkthroughs are NOT covered here -- there is nothing to "
        "execute in\nthem. README.md carries their completion checklist."
    )
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
