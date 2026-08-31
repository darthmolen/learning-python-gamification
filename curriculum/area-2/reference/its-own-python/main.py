"""REFERENCE -- Datamine payload for the `a2-its-own-python` quest. The DM's copy.

Do not put this on the learner's machine until it has been unlocked. See README.md in
the parent directory for the rules that come with unlocking one.

This is the smallest honest answer to the quest: a program that CANNOT run without
something installed. That is the whole requirement -- a project whose `main.py` would
work identically with an empty environment has not needed a virtual environment yet,
and the brief says so.

    See README.md next to this file for the four commands that make it run.
"""

# concepts: venv, pip, running-scripts, print
# dc: 12
# expect: ok
#
# Those tags describe this file INSIDE ITS OWN ENVIRONMENT. `../verify.py` does not run
# it and says so out loud: any file under a directory holding a `requirements.txt` has
# an environment the area harness does not have. Removing the requirements.txt is what
# makes the harness try, and it then fails with ModuleNotFoundError -- which is the
# correct, loud answer.

# pyright: reportMissingImports=false
#   pyfiglet lives in a virtual environment that this repository deliberately does not
#   contain and must never commit. A type checker run against the repo's own Python is
#   right that it cannot see it, and wrong that this is a defect.
import pyfiglet

banner = pyfiglet.figlet_format("PyQuest")

print(banner)
print("If there is a giant word above this line, the environment worked.")
print("Nothing else on this machine can see the package that drew it.")
