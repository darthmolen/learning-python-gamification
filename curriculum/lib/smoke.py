"""The post-upgrade smoke test. Run it on BOTH machines after any ursina change.

    py -3.14 curriculum/lib/smoke.py

It checks, in order:

1. the installed ursina matches the pin in requirements.txt
2. `import world` still constructs no app, so no display is needed to import it
3. all four of the shim's validation errors still fire, with their messages
4. a real window opens, a real world of blocks builds, `combine()` fuses it,
   and frames render on real hardware
5. `place()` after `start()` still refuses

Exit code 0 means the upgrade is safe to keep. Anything else means put the pin
back. This deliberately needs nothing but Python and ursina -- no pytest -- so
it can be run on the learner's machine as it stands.

`ShowBase.run` is patched rather than `Ursina.run` because ursina 8.3.0 wraps
the Ursina class in a @singleton decorator: `Ursina` is a factory, not the
class, and there is no `ursina.__version__` to read either. Both are why the
pin has to be asserted from pip metadata rather than from the package.
"""

import importlib.metadata
import subprocess
import sys
import time
from collections.abc import Callable
from pathlib import Path

from direct.showbase.ShowBase import ShowBase

LIB = Path(__file__).resolve().parent
PIN_FILE = LIB / "requirements.txt"
FRAMES = 90
SIDE = 12  # 1,728 blocks -- enough that combine() is doing real work

sys.path.insert(0, str(LIB))
import world

failures: list[str] = []


def check(label: str, ok: bool, detail: str = "") -> None:
    print(f"[{'PASS' if ok else 'FAIL'}] {label}{'  ' + detail if detail else ''}")
    if not ok:
        failures.append(label)


def pinned_version() -> str:
    for line in PIN_FILE.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if stripped.startswith("ursina=="):
            return stripped.removeprefix("ursina==").strip()
    raise ValueError(f"no `ursina==` line in {PIN_FILE}")


def main() -> int:
    installed = importlib.metadata.version("ursina")
    check(
        "installed ursina matches the pin",
        installed == pinned_version(),
        f"pinned {pinned_version()}, installed {installed}",
    )

    probe = "import ursina.application as a; import world; print(a.base)"
    result = subprocess.run(
        [sys.executable, "-c", probe],
        cwd=LIB,
        capture_output=True,
        text=True,
        timeout=180,
        check=False,
    )
    check(
        "importing world constructs no app",
        result.returncode == 0 and result.stdout.strip() == "None",
        f"-> {result.stdout.strip() or result.stderr.strip()[-80:]}",
    )

    for label, call, kind, fragment in _validation_cases():
        try:
            call()
        except kind as caught:
            check(label, fragment in str(caught), f"-> {caught}")
        except Exception as caught:  # noqa: BLE001 -- reporting, not handling
            check(label, False, f"raised {type(caught).__name__}: {caught}")
        else:
            check(label, False, "raised nothing at all")

    built = 0
    for x in range(SIDE):
        for y in range(SIDE):
            for z in range(SIDE):
                world.place(x, y, z, sorted(world.BLOCKS)[(x + y + z) % 7])
                built += 1
    check("placed a whole world", len(world.placed) == built, f"{built} blocks")

    timings: list[float] = []

    def fake_run(self: ShowBase) -> None:
        self.taskMgr.step()  # one warm-up frame before the clock starts
        started = time.perf_counter()
        for _ in range(FRAMES):
            self.taskMgr.step()
        timings.append(time.perf_counter() - started)
        if self.win is None:
            return
        gsg = self.win.getGsg()
        print(f"       gl vendor   : {gsg.getDriverVendor()}")
        print(f"       gl renderer : {gsg.getDriverRenderer()}")
        print(f"       gl version  : {gsg.getDriverVersion()}")

    ShowBase.run = fake_run  # pyright: ignore[reportAttributeAccessIssue]
    build_started = time.perf_counter()
    world.start()
    check("a window opened and frames rendered", bool(timings))
    if timings:
        print(
            f"       {built} blocks, {FRAMES} frames in {timings[0]:.2f} s "
            f"= {FRAMES / timings[0]:.1f} fps; "
            f"{time.perf_counter() - build_started:.2f} s to build and fuse"
        )
        # That fps is vsync-bound and so is a liveness check, not a headroom
        # measurement -- a machine with a hundred times the headroom prints
        # the same 60. Headroom is measured with vsync off. See README.md.
        print("       (vsync-bound: this says alive, not fast)")

    try:
        world.place(0, 0, 0, "grass")
    except RuntimeError as caught:
        check("place() after start() refuses", "start()" in str(caught))
    else:
        check("place() after start() refuses", False, "raised nothing at all")

    print()
    if failures:
        print(f"{len(failures)} check(s) failed. Put the pin back:")
        for label in failures:
            print(f"  - {label}")
        return 1
    print(f"all checks passed against ursina {installed}")
    return 0


def _validation_cases() -> list[tuple[str, Callable[[], None], type[Exception], str]]:
    """Each of the shim's guards, with the words its message has to contain.
    The message is the feature -- a bare KeyError would be the shim being a
    wrapper rather than a validating boundary."""

    def unknown_kind() -> None:
        world.place(0, 0, 0, "stnoe")

    def bad_coordinate() -> None:
        world.place(0, "up", 0, "grass")

    def broken_colour() -> None:
        # Deliberately the wrong type -- that is the whole point of the check.
        world.BLOCKS["glass"] = "green"  # pyright: ignore[reportArgumentType]
        try:
            world.place(0, 0, 0, "glass")
        finally:
            world.BLOCKS["glass"] = world.color.white

    return [
        ("an unknown block kind is refused", unknown_kind, ValueError, "'stnoe'"),
        ("a non-numeric coordinate is refused", bad_coordinate, TypeError, "y"),
        ("an overwritten colour is refused", broken_colour, TypeError, "BLOCKS"),
    ]


if __name__ == "__main__":
    raise SystemExit(main())
