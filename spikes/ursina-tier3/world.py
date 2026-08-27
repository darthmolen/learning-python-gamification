# THROWAWAY — spike shim, not shipping code. Written to be measured, not shipped.
#
# The Tier 3 shim. Three names, positional arguments only, no keyword arguments
# anywhere in the surface a learner touches:
#
#     BLOCKS                 a dict of kind -> colour
#     place(x, y, z, kind)   put one block in the world
#     start()                open the window and show it
#
# Retirement: place() and BLOCKS become his own def and his own dict at Tier 4;
# start() becomes his own class World at Tier 5. See the plan's Phase 5 table.
from ursina import *

__all__ = ['BLOCKS', 'place', 'start']

BLOCKS = {
    'grass': color.green,
    'dirt': color.brown,
    'stone': color.gray,
    'sand': color.yellow,
    'water': color.azure,
    'wood': color.orange,
    'glass': color.white,
}

app = Ursina()
ground = Entity()
placed = []


def place(x, y, z, kind):
    if kind not in BLOCKS:
        raise ValueError(
            f"place() does not know the block kind {kind!r}. "
            f"The kinds it knows are {sorted(BLOCKS)}."
        )
    placed.append([x, y, z])
    return Entity(parent=ground, model='cube', color=BLOCKS[kind], position=(x, y, z))


def start():
    # Fuse every placed block into one mesh. One Entity per block costs one draw
    # call per block, which measured at 12 fps for 5000 blocks on an RTX 5090.
    # Combined, the same 5000 blocks run at 3366 fps. See README, Phase 5.
    # Point the camera at the middle of whatever got placed, far enough back
    # to see all of it. Nothing here is beyond Tier 3 except the def itself.
    if placed:
        ground.combine()
        xs = []
        ys = []
        zs = []
        for spot in placed:
            xs.append(spot[0])
            ys.append(spot[1])
            zs.append(spot[2])
        span = max([max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs)]) + 2
        middle_x = (max(xs) + min(xs)) / 2
        middle_y = (max(ys) + min(ys)) / 2
        middle_z = (max(zs) + min(zs)) / 2
        view = EditorCamera()
        view.position = (middle_x, middle_y, middle_z)
        view.target_z = -span * 2.5 - 5
        camera.z = view.target_z
    else:
        EditorCamera()
    app.run()
