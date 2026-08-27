"""THROWAWAY — spike benchmark, not learner code.

Measures the cost of the stock voxel pattern (one Entity per block) against a
combined static mesh, so Phase 5 can write performance rules from numbers rather
than folklore. Run one config per process; Ursina is a singleton.

    py -3.14 _bench.py <naive|collider|combined> <block_count>
"""
import sys
import time

from panda3d.core import loadPrcFileData

loadPrcFileData('', 'sync-video false')

from ursina import Ursina, Entity, color, camera, application

mode = sys.argv[1]
count = int(sys.argv[2])

app = Ursina(vsync=False, development_mode=False, window_type='onscreen', size=(1280, 720))

side = 1
while side * side * side < count:
    side += 1

blocks = []
made = 0
for x in range(side):
    for y in range(side):
        for z in range(side):
            if made >= count:
                break
            tint = color.green if y == side - 1 else color.brown
            if mode == 'collider':
                blocks.append(Entity(model='cube', color=tint, position=(x, y, z), collider='box'))
            else:
                blocks.append(Entity(model='cube', color=tint, position=(x, y, z)))
            made += 1

if mode == 'combined':
    parent = Entity()
    for b in blocks:
        b.parent = parent
    parent.combine()

camera.position = (side / 2, side / 2, -side * 2.2)

WARMUP, SAMPLE = 30, 120
for _ in range(WARMUP):
    app.taskMgr.step()
t0 = time.perf_counter()
for _ in range(SAMPLE):
    app.taskMgr.step()
elapsed = time.perf_counter() - t0

entities = len(application.scene.entities) if hasattr(application, 'scene') else -1
print(f"RESULT mode={mode} blocks={count} fps={SAMPLE / elapsed:6.1f} frame_ms={elapsed / SAMPLE * 1000:6.2f}")
raise SystemExit(0)
