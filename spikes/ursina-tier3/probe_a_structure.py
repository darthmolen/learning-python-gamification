# THROWAWAY — spike probe, not curriculum content, not shipping code.
# Probe A: raw Ursina, Tier 0-3 vocabulary only. Exercises list, range, nested for.
from ursina import *

app = Ursina()

palette = ['grass', 'dirt', 'stone']
tints = {'grass': color.green, 'dirt': color.brown, 'stone': color.gray}

# A staircase: each step is a column of three blocks, grass on top.
for step in range(6):
    for depth in range(3):
        kind = palette[depth]
        Entity(model='cube', color=tints[kind], position=(step - 3, step - depth, 0))

# A tower on the top step.
for height in range(4):
    Entity(model='cube', color=color.azure, position=(3, height + 6, 0))

EditorCamera()
camera.position = (0, 4, -22)
app.run()
