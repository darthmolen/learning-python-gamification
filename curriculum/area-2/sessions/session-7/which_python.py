"""Not which Python you meant. Which one IS.

Every argument about a missing package that you will ever have with a
computer is this file's output being different from what you assumed. Run it
before the virtual environment, run it after, and run it whenever a package
you definitely installed is definitely not there.

    py -3.14 which_python.py
"""

# concepts: venv, running-scripts, if, else, print, f-strings
# dc: 12
# expect: ok

import sys

print("The Python running this file is:")
print(f"    {sys.executable}")
version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
print(f"    version {version}")
print()

if sys.prefix == sys.base_prefix:
    print("No virtual environment is active.")
    print("This is the machine's own Python, shared by everything on it.")
else:
    print("A virtual environment IS active, and it lives here:")
    print(f"    {sys.prefix}")
    print("Anything you pip install right now goes in there and nowhere else.")


# ---------------------------------------------------------------------------
# YOUR MOVE
#
# 1. Run it now, before you have made any environment. Write down the path.
#
# 2. Run it with the OTHER command -- `python which_python.py` instead of
#    `py -3.14 which_python.py`. On this machine you may get a different
#    answer, and a different version number, from the same folder, in the
#    same second.
#
#    That is not a bug and nobody did it to you. There is more than one
#    Python on this computer and the word `python` picks one of them
#    depending on which shell you are standing in.
#
# 3. Make a virtual environment, activate it, and run it a third time.
#    Both lines change.
#
# 4. Deactivate, and run it a fourth time. They change back.
#
# The walkthrough tells you when to do 3 and 4. Do not race ahead: the point
# is the difference between the runs, and you only get that by doing them in
# order and reading each one.
# ---------------------------------------------------------------------------
