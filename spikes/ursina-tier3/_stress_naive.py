# THROWAWAY — the same world, raw Ursina, one Entity per block.
from ursina import *
app = Ursina()
for x in range(20):
    for y in range(20):
        for z in range(20):
            Entity(model='cube', color=color.gray, position=(x, y, z))
EditorCamera()
camera.z = -60
app.run()
