# THROWAWAY — spike probe, not curriculum content, not shipping code.
# Probe C: raw Ursina. Contains a DELIBERATE KeyError, to see what the learner
# sees when a Tier 3 typo meets a game engine.
from ursina import *

app = Ursina()

tints = {'grass': color.green, 'stone': color.gray}
wanted = ['grass', 'stone', 'diamond']

for i in range(3):
    kind = wanted[i]
    Entity(model='cube', color=tints[kind], position=(i - 1, 0, 0))

EditorCamera()
app.run()
