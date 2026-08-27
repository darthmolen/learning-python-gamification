"""THROWAWAY — spike harness, not learner code, not shipping code.

Runs a probe for a fixed number of frames, saves a screenshot, and exits, so a
probe can be verified without a human sitting in front of a blocking window.

Patches ShowBase.run rather than Ursina.run because ursina 8.3.0 wraps the
Ursina class in a @singleton decorator, so `Ursina` is a factory, not the class.
"""
import runpy
import sys
from pathlib import Path

from direct.showbase.ShowBase import ShowBase
from panda3d.core import Filename

FRAMES = 90


def main():
    probe = Path(sys.argv[1]).resolve()
    shot = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else None

    def fake_run(self, *args, **kwargs):
        for _ in range(FRAMES):
            self.taskMgr.step()
        gsg = self.win.getGsg()
        print(f"[runner] gl vendor  : {gsg.getDriverVendor()}", flush=True)
        print(f"[runner] gl renderer: {gsg.getDriverRenderer()}", flush=True)
        print(f"[runner] gl version : {gsg.getDriverVersion()}", flush=True)
        if shot is not None:
            self.graphicsEngine.renderFrame()
            ok = self.win.saveScreenshot(Filename.fromOsSpecific(str(shot)))
            print(f"[runner] screenshot {shot.name} -> {ok}", flush=True)
        print(f"[runner] ran {FRAMES} frames, exited clean", flush=True)
        raise SystemExit(0)

    ShowBase.run = fake_run
    runpy.run_path(str(probe), run_name="__main__")


main()
