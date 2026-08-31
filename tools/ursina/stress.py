"""Measure steady-state fps at a given block count, on this machine.

    py -3.14 tools/ursina/stress.py                      # all four sizes, both modes
    py -3.14 tools/ursina/stress.py --blocks 5000        # one size, both modes
    py -3.14 tools/ursina/stress.py --blocks 5000 --mode shim

Why this file exists. The spike's `_stress_shim.py` and `_stress_naive.py` are
three nested `range(20)` loops -- 8,000 blocks, hard-coded, because 8,000 was
the number the spike was asking about. Phase 3 of
`planning/blocked/feature_world-shim_2026-08-28.md` asks for 1,000 / 2,500 /
5,000 / 8,000, fused and naive, which those two files cannot produce without
being edited between every run. The originals are kept beside this one, in
`spikes/ursina-tier3/`, unchanged.

The timing method is `spikes/ursina-tier3/_timed_runner.py`'s, so the numbers
are comparable with the ones already recorded there: vsync off, 30 frames of
warm-up discarded, then 60 frames timed. Startup is measured from process start
to the moment the window would have opened, because on 5,000 blocks the
`combine()` cost is most of it and it is the half of the answer a learner
actually feels.

Not learner code. This is a measuring instrument for one afternoon.
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

from panda3d.core import loadPrcFileData

# Before ShowBase exists, or the window paces itself to the monitor and every
# number below is the refresh rate rather than the machine's capability.
loadPrcFileData("", "sync-video false")

from direct.showbase.ShowBase import ShowBase

SIZES = (1000, 2500, 5000, 8000)
MODES = ("shim", "naive")


def cube_coords(count: int) -> list[tuple[int, int, int]]:
    """`count` positions in as close to a cube as `count` allows.

    A cube rather than a slab because the naive mode's cost is per Entity and
    the shim's is per vertex, and a flat sheet flatters one of them.
    """
    side = 1
    while side**3 < count:
        side += 1

    spots: list[tuple[int, int, int]] = []
    for x in range(side):
        for y in range(side):
            for z in range(side):
                if len(spots) == count:
                    return spots
                spots.append((x, y, z))
    return spots


def measure(mode: str, count: int) -> tuple[float, float, int]:
    """Build `count` blocks the given way and return (startup_s, fps, entities)."""
    started = time.perf_counter()
    result: dict[str, float | int] = {}

    def fake_run(self: ShowBase, *args: object, **kwargs: object) -> None:
        result["startup"] = time.perf_counter() - started

        for _ in range(30):  # warm-up, discarded
            self.taskMgr.step()

        t0 = time.perf_counter()
        for _ in range(60):
            self.taskMgr.step()
        elapsed = time.perf_counter() - t0

        from ursina import scene

        result["fps"] = 60 / elapsed
        result["entities"] = len(scene.entities)
        raise SystemExit(0)

    original = ShowBase.run
    ShowBase.run = fake_run  # type: ignore[method-assign]
    try:
        if mode == "shim":
            # The shim is imported the way a learner imports it -- by name, off the
            # path -- rather than through a package, because a package is exactly the
            # vocabulary Area 3 does not have yet. pyright cannot follow a path put
            # there at run time, and adding curriculum/lib to a config would make this
            # one script's convenience everybody else's import surface.
            sys.path.insert(
                0, str(Path(__file__).resolve().parents[2] / "curriculum" / "lib")
            )
            import world  # pyright: ignore[reportMissingImports]

            for x, y, z in cube_coords(count):
                world.place(x, y, z, "stone")
            world.start()
        else:
            from ursina import EditorCamera, Entity, Ursina, Vec3, camera, color

            app = Ursina()
            for x, y, z in cube_coords(count):
                Entity(model="cube", color=color.gray, position=Vec3(x, y, z))
            EditorCamera()
            camera.z = -(round(count ** (1 / 3)) * 3 + 20)
            app.run()  # pyright: ignore[reportAttributeAccessIssue]
    except SystemExit:
        pass
    finally:
        ShowBase.run = original  # type: ignore[method-assign]

    return float(result["startup"]), float(result["fps"]), int(result["entities"])


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--blocks", type=int, help="one size; default is all four")
    parser.add_argument("--mode", choices=MODES, help="one mode; default is both")
    args = parser.parse_args()

    # One process per measurement. Ursina 8.3.0 wraps Ursina in @singleton, so a
    # second Ursina() in the same process gets the first one back -- every size
    # after the first would report the first size's numbers. Measured, not
    # assumed: this is why the loop re-invokes rather than iterating in place.
    if args.blocks is None or args.mode is None:
        import subprocess

        sizes = (args.blocks,) if args.blocks else SIZES
        modes = (args.mode,) if args.mode else MODES
        for count in sizes:
            for mode in modes:
                subprocess.run(
                    [sys.executable, __file__, "--blocks", str(count), "--mode", mode],
                    check=False,
                )
        return 0

    startup, fps, entities = measure(args.mode, args.blocks)
    print(
        f"RESULT mode={args.mode:5s} blocks={args.blocks:5d} "
        f"startup_s={startup:6.2f} fps={fps:8.1f} entities={entities}",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
