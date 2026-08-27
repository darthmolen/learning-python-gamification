"""THROWAWAY — like _runner.py but reports startup time and steady-state fps."""
import runpy, sys, time
from panda3d.core import loadPrcFileData
loadPrcFileData('', 'sync-video false')
from direct.showbase.ShowBase import ShowBase

start_time = time.perf_counter()

def fake_run(self, *a, **k):
    startup = time.perf_counter() - start_time
    for _ in range(30):
        self.taskMgr.step()
    t0 = time.perf_counter()
    for _ in range(60):
        self.taskMgr.step()
    dt = time.perf_counter() - t0
    from ursina import scene
    print(f"RESULT startup_s={startup:6.2f} fps={60/dt:8.1f} entities={len(scene.entities)}", flush=True)
    raise SystemExit(0)

ShowBase.run = fake_run
runpy.run_path(sys.argv[1], run_name="__main__")
