"""Hidden tests for a2-its-own-python. Spec §6.3: these never reach the browser.

**What this file can and cannot check, stated because it constrains the quest.** §6.6 runs
every submission with `--network none`, so the runner cannot `pip install` anything. A
`local-repo` test therefore cannot prove his virtual environment works; it can only prove
he *declared* one properly and did not commit it. That is not a weakness in the quest --
the two things that actually go wrong with venvs are committing the whole directory and
having no record of what was installed, and both of those are checkable offline.

The half that needs a person -- watching him activate it, and watching the prompt change
-- is the dm's, on the night, and the brief says so.

`PYQUEST_REPO`, as in a2-where-the-file-lives: the clone root is not yet pinned down by
the API contract, and this is the line that changes when it is.
"""

import os
import pathlib
import re

REPO = pathlib.Path(os.environ.get("PYQUEST_REPO", ".")).resolve()
PROJECT = REPO / "its-own-python"
REQUIREMENTS = PROJECT / "requirements.txt"
MAIN = PROJECT / "main.py"
NOTES = PROJECT / "README.md"

# `name`, `name==1.2.3`, `name>=1.2`. Deliberately loose: pinning is Area 6 vocabulary
# (`dependencies`) and rejecting an unpinned line here would be marking him against a
# lesson he has not had.
REQUIREMENT = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*\s*(?:[=<>!~]=?\s*[\w.*+!-]+)?$")


def requirement_lines() -> list[str]:
    text = REQUIREMENTS.read_text(encoding="utf-8")
    return [
        line.strip()
        for line in text.splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]


def test_the_project_directory_exists() -> None:
    assert PROJECT.is_dir(), (
        "expected a directory called its-own-python at the top of your repository"
    )


def test_requirements_names_at_least_one_thing() -> None:
    assert REQUIREMENTS.is_file(), "expected its-own-python/requirements.txt"
    lines = requirement_lines()
    assert lines, (
        "requirements.txt is empty. It is the list of things somebody else has to install "
        "before your program will run. If there is nothing on it, why did you need a venv?"
    )
    bad = [line for line in lines if not REQUIREMENT.match(line)]
    assert not bad, f"these do not look like requirements: {bad}"


def test_the_program_imports_something() -> None:
    assert MAIN.is_file(), "expected its-own-python/main.py"
    source = MAIN.read_text(encoding="utf-8")
    assert re.search(r"^\s*(import|from)\s+\w", source, re.MULTILINE), (
        "main.py imports nothing, so it does not need the environment you built for it"
    )


def test_the_venv_was_not_committed() -> None:
    """The single most common thing that goes wrong, and it is visible in the clone.

    Thousands of files he did not write, arriving on somebody else's machine, all of them
    rebuildable from one line of requirements.txt.
    """
    committed = [
        path
        for name in (".venv", "venv", "env")
        for path in REPO.rglob(name)
        if path.is_dir() and ".git" not in path.parts
    ]
    assert not committed, (
        f"a virtual environment is in the repository: {[str(p) for p in committed]}. "
        "How many of those files did you write?"
    )


def test_gitignore_keeps_it_out() -> None:
    """Not committing it once is luck. Ignoring it is the fix."""
    gitignore = REPO / ".gitignore"
    assert gitignore.is_file(), "expected a .gitignore at the top of your repository"
    patterns = gitignore.read_text(encoding="utf-8")
    assert re.search(r"^\s*\.?(venv|env)/?\s*$", patterns, re.MULTILINE), (
        ".gitignore does not mention a virtual environment. Not committing it by accident "
        "is luck; ignoring it is the fix."
    )


def test_the_readme_says_how_to_build_it() -> None:
    """§5.3 step 4: the exact command comes from his README, typed as written."""
    assert NOTES.is_file(), "expected its-own-python/README.md"
    written = NOTES.read_text(encoding="utf-8").lower()
    for phrase in ("venv", "pip install", "requirements.txt"):
        assert phrase in written, (
            f"README.md never mentions {phrase!r}. Somebody who has never seen this "
            "project has to build it from what is written there."
        )
