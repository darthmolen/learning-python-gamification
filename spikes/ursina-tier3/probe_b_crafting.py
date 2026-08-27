# THROWAWAY — spike probe, not curriculum content, not shipping code.
# Probe B: raw Ursina, Tier 0-3 vocabulary only. Exercises dict, set, in, membership.
from ursina import *

app = Ursina()

inventory = ['wood', 'wood', 'wood', 'wood', 'stone', 'stone', 'stone']
recipes = {
    'plank': ['wood'],
    'table': ['wood', 'wood', 'wood', 'wood'],
    'furnace': ['stone', 'stone', 'stone'],
    'torch': ['wood', 'coal'],
}
tints = {'plank': color.brown, 'table': color.orange, 'furnace': color.gray, 'torch': color.yellow}

have = set(inventory)
craftable = []
for name in sorted(recipes):
    needed = recipes[name]
    enough = True
    for item in needed:
        if item not in have:
            enough = False
        if inventory.count(item) < needed.count(item):
            enough = False
    if enough:
        craftable.append(name)

print('craftable:', craftable)

slot = 0
for name in craftable:
    Entity(model='cube', color=tints[name], position=(slot - 1, 0, 0))
    slot = slot + 1

EditorCamera()
camera.position = (0, 0, -8)
app.run()
