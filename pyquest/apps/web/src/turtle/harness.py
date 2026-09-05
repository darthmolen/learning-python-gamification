"""Run a learner's program and report failure the way CPython would.

Pyodide's own ``runPythonAsync`` raises through three frames of ``_pyodide/_base.py``, so a
one-line syntax error arrives wearing a stack that begins in a file the learner has never seen,
inside a zip that does not exist on his machine. The four lines that matter sit at the bottom.

This runs his code from Python instead, catches at the top, and formats the traceback with
``traceback`` — which produces exactly what ``python his_file.py`` produces, because it is the
same module doing it.

**This is not hiding the stack.** §4's Area 4 has him writing functions that call functions, and
those tracebacks will be several frames deep and every frame will be his. Learning to read one
is a real skill; learning to skip ``_pyodide/_base.py`` is a PyQuest-specific one that transfers
nowhere.
"""

from __future__ import annotations

import linecache
import sys
import traceback
from types import TracebackType


def run_program(source: str, filename: str) -> str | None:
    """Execute ``source``. Return the traceback as a string, or ``None`` if it ran clean."""
    # His code is a string, not a file, so `traceback` cannot find the line to quote and prints
    # the frame bare. The quoted line is the most useful part of a traceback to a beginner --
    # it is the difference between "line 2" and seeing `return n / 0` -- so `linecache` is
    # primed by hand with what would have been on disk.
    linecache.cache[filename] = (len(source), None, source.splitlines(keepends=True), filename)

    try:
        return _execute(source, filename)
    finally:
        # CPython flushes stdout when the interpreter exits, and this stands in for
        # `python his_file.py`, so it has to as well.
        #
        # This is Python's own buffer, and it is one of two that used to strand a learner's
        # output. `print("side", end=" ")` sits in it until something forces it out; a program
        # that then raised showed him a traceback and none of what he had printed on the way to
        # it. Area 0 teaches `print` before it teaches anything else, so "what I printed did not
        # appear" is the worst possible first lesson about the tool.
        #
        # The other buffer is on the JavaScript side and is not reachable from here --
        # `runner.worker.ts` had to stop asking Pyodide for stdout a line at a time. Neither fix
        # covers the other: this one was verified by removing it and watching `end=""` vanish
        # again with the worker already correct.
        sys.stdout.flush()


def _execute(source: str, filename: str) -> str | None:
    """Compile and run, reporting a failure the way CPython prints one."""
    try:
        code = compile(source, filename, "exec")
    except SyntaxError:
        # A SyntaxError never ran, so it has no stack worth showing — CPython prints the file,
        # the line, a caret and the message, and so does this.
        return "".join(traceback.format_exception_only(*sys.exc_info()[:2]))

    try:
        exec(code, {"__name__": "__main__", "__file__": filename})  # noqa: S102
    except BaseException:  # noqa: BLE001 - a learner may raise anything at all, including SystemExit
        exc_type, exc, tb = sys.exc_info()
        return "".join(traceback.format_exception(exc_type, exc, _drop_this_frame(tb)))

    return None


def _drop_this_frame(tb: TracebackType | None) -> TracebackType | None:
    """Remove the ``exec`` call above his code, which is scaffolding rather than his program."""
    return tb.tb_next if tb is not None else None
