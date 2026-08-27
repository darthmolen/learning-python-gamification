"""THROWAWAY — how long does combine() itself take to build?"""
import sys, time
from panda3d.core import loadPrcFileData
loadPrcFileData('', 'sync-video false')
from ursina import Ursina, Entity, color

count = int(sys.argv[1])
app = Ursina(vsync=False, development_mode=False, size=(1280, 720))
side = 1
while side ** 3 < count:
    side += 1
holder = Entity()
made = 0
t0 = time.perf_counter()
for x in range(side):
    for y in range(side):
        for z in range(side):
            if made >= count:
                break
            Entity(parent=holder, model='cube', color=color.green, position=(x, y, z))
            made += 1
t_build = time.perf_counter() - t0
t1 = time.perf_counter()
holder.combine()
t_combine = time.perf_counter() - t1
print(f"RESULT blocks={count} build_s={t_build:6.2f} combine_s={t_combine:6.2f} total_s={t_build + t_combine:6.2f}")
raise SystemExit(0)
