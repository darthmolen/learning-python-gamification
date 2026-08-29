# STUB -- the spike shim's behaviour with none of the hardening. RED stage only.
#
# The Tier 3 shim. Three names, positional arguments only.
from ursina import *

BLOCKS = {
    'grass': color.green,
    'dirt': color.brown,
    'stone': color.gray,
    'sand': color.yellow,
    'water': color.azure,
    'wood': color.orange,
    'glass': color.white,
}

placed = []


def place(x, y, z, kind):
    placed.append((x, y, z, kind))


def start():
    app = Ursina()
    ground = Entity()
    for spot in placed:
        Entity(parent=ground, model='cube', color=BLOCKS[spot[3]],
               position=(spot[0], spot[1], spot[2]))
    EditorCamera()
    app.run()
