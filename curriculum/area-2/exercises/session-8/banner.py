"""A file with two jobs, which is one job more than any file you have written.

Job one: be run. Job two: be imported by another file, and stay quiet while
it is. The four-word line near the bottom is how it tells the two apart.

    py -3.14 banner.py
"""

# concepts: main-guard, running-scripts, variables, str, print, f-strings
# dc: 12
# expect: ok

title = "AREA 2 - ESCAPE THE SANDBOX"

if __name__ == "__main__":
    print("=" * len(title))
    print(title)
    print("=" * len(title))
    print("banner.py was RUN.")


# ---------------------------------------------------------------------------
# YOUR MOVE
#
# `__name__` is another word Python fills in for you, like `__file__`. It
# holds one of two things and never anything else:
#
#   - the text "__main__", if this is the file you ran;
#   - the file's own name, if somebody else imported it.
#
# So `if __name__ == "__main__":` is a comparison you can already read. It
# says: only do this when I am the one being run.
#
# 1. Run this file. The banner prints.
#
# 2. Run show_the_banner.py, which imports this one. The banner does NOT
#    print, and `title` is still available to be used.
#
# 3. Now delete the `if` line and un-indent the four prints under it. Run
#    show_the_banner.py again. The banner prints when nobody asked for it.
#
# 4. Put it back. That is the whole of `main-guard`, and you now have a
#    reason for it rather than a rule about it.
# ---------------------------------------------------------------------------
