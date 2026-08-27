# THROWAWAY — spike probe, shimmed. Tier 0-3 vocabulary only.
from world import *

inventory = ['wood', 'wood', 'wood', 'wood', 'stone', 'stone', 'stone']
recipes = {
    'plank': ['wood'],
    'table': ['wood', 'wood', 'wood', 'wood'],
    'furnace': ['stone', 'stone', 'stone'],
    'torch': ['wood', 'coal'],
}
made_of = {'plank': 'wood', 'table': 'wood', 'furnace': 'stone', 'torch': 'wood'}

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
    place(slot - 1, 0, 0, made_of[name])
    slot = slot + 1

start()
