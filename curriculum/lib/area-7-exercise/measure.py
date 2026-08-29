"""Run a world program with vsync off and report what it actually renders at.

    py -3.14 curriculum/lib/area-7-exercise/measure.py [program.py]

Defaults to the_missing_line.py beside this file. Vsync is disabled on purpose:
left on, every program that is fast enough prints 60 and every program that is
fast enough prints the same 60, which tells you nothing about how much room is
left. Off, the number is the truth.

Reports two things, and they move in opposite directions:

    build   how long it took to make the world before the window opened
    fps     how fast it draws once it is there

`ShowBase.run` is patched rather than `Ursina.run` because ursina 8.3.0 wraps
the Ursina class in a @singleton decorator, so `Ursina` is a factory and not
the class.
"""

import runpy
import sys
import time
from pathlib import Path

from direct.showbase.ShowBase import ShowBase
from panda3d.core import loadPrcFileData

HERE = Path(__file__).resolve().parent
LIB = HERE.parent
WARMUP = 30
FRAMES = 120


def main() -> int:
    program = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "the_missing_line.py"
    program = program.resolve()
    if not program.is_file():
        print(f"no such program: {program}")
        return 2

    loadPrcFileData("", "sync-video false")
    loadPrcFileData("", "win-size 1280 720")
    sys.path.insert(0, str(LIB))

    started = time.perf_counter()

    def fake_run(self: ShowBase) -> None:
        build = time.perf_counter() - started
        for _ in range(WARMUP):
            self.taskMgr.step()
        timing_started = time.perf_counter()
        for _ in range(FRAMES):
            self.taskMgr.step()
        elapsed = time.perf_counter() - timing_started
        print()
        print(f"  program : {program.name}")
        print(f"  build   : {build:.2f} s")
        print(f"  fps     : {FRAMES / elapsed:.1f}")
        print(f"  frame   : {elapsed / FRAMES * 1000:.2f} ms")
        print(f"            ({FRAMES} frames, after {WARMUP} warm-up frames)")
        raise SystemExit(0)

    ShowBase.run = fake_run  # pyright: ignore[reportAttributeAccessIssue]
    runpy.run_path(str(program), run_name="__main__")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
