"""Hidden tests for a2-where-the-file-lives. Spec §6.3: these never reach the browser.

The `local-repo` verifier pulls his repository and runs this specification against the
clone (§6.4). **Where the clone is rooted is not yet pinned down by the API contract**, so
this file reads `PYQUEST_REPO` and falls back to the working directory. If the runner
settles on something else, this is the line that changes and it is the same line in both
Area 2 test files.

The whole quest is one idea -- a file is somewhere, and running it depends on where you
are standing -- so the assertions are about the filesystem and about a subprocess, and
none of them are about how clever the Python is. Two lines of `print` would pass, and
should: session 5's subject is not the program.
"""

import os
import pathlib
import subprocess
import sys

REPO = pathlib.Path(os.environ.get("PYQUEST_REPO", ".")).resolve()
PROJECT = REPO / "where-the-file-lives"
SCRIPT = PROJECT / "run_me.py"
NOTES = PROJECT / "NOTES.md"

# Long enough to be three real sentences, short enough not to be an essay. The same
# substance-over-existence rule the Journal is scored by (§5.6).
MIN_NOTES_CHARACTERS = 120


def test_the_project_directory_exists() -> None:
    assert PROJECT.is_dir(), (
        "expected a directory called where-the-file-lives at the top of your repository"
    )


def test_the_script_is_in_it() -> None:
    assert SCRIPT.is_file(), "expected where-the-file-lives/run_me.py"


def test_it_runs_from_its_own_directory() -> None:
    """The command works when you are standing in the right place."""
    done = subprocess.run(
        [sys.executable, "run_me.py"],
        cwd=PROJECT,
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    )
    assert done.returncode == 0, f"run_me.py did not run cleanly:\n{done.stderr}"
    assert done.stdout.strip(), "run_me.py ran and printed nothing"


def test_it_says_it_is_running_from_a_file() -> None:
    done = subprocess.run(
        [sys.executable, "run_me.py"],
        cwd=PROJECT,
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    )
    assert "I am running from a file." in done.stdout, (
        "run_me.py must print the line: I am running from a file."
    )


def test_the_same_command_fails_one_directory_up() -> None:
    """The point of the quest, asserted rather than described.

    Identical command, different directory, different outcome. If this passes when it
    should fail, there is a second copy of run_me.py in the repository root -- which is
    itself the lesson, one directory earlier.
    """
    done = subprocess.run(
        [sys.executable, "run_me.py"],
        cwd=REPO,
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    )
    assert done.returncode != 0, (
        "`run_me.py` ran from the repository root too, which means there are two copies "
        "of it. Where does the file actually live?"
    )


def test_the_notes_say_where_it_went_wrong() -> None:
    assert NOTES.is_file(), "expected where-the-file-lives/NOTES.md"
    written = NOTES.read_text(encoding="utf-8").strip()
    assert len(written) >= MIN_NOTES_CHARACTERS, (
        "NOTES.md is too short. Three sentences: where the file is, where you ran it "
        "from, and what happened when you ran it from the wrong place."
    )
