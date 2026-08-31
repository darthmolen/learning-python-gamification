"""Blocks in a world, in three names.

    BLOCKS                 a dict of block kind -> color
    place(x, y, z, kind)   put one block in the world
    start()                open the window and show what was placed

Every call is positional, so using this needs nothing but calling a function
and reading a dict.

This is scaffolding, and it comes down on a schedule. BLOCKS and place() are
replaced by your own dict and your own def at Area 4; start() by your own
class World at Area 5. README.md, beside this file, has the schedule and the
measured numbers behind it.
"""

from ursina import Color, EditorCamera, Entity, Ursina, Vec3, camera, color

__all__ = ["BLOCKS", "place", "start"]

BLOCKS: dict[str, Color] = {
    "grass": color.green,
    "dirt": color.brown,
    "stone": color.gray,
    "sand": color.yellow,
    "water": color.azure,
    "wood": color.orange,
    "glass": color.white,
}

# Everything place() has been asked for, in order. start() turns it into
# blocks. Area 3's checker reads this list to see what a program built without
# opening a window, so it keeps a plain name and a plain shape.
placed: list[tuple[float, float, float, str]] = []

# Holds the app once start() has built it, and is empty until then. A list
# rather than a flag so that place() can ask whether the world is already
# running using nothing but `if`, which costs no new vocabulary.
_running: list[Ursina] = []


def _not_a_number(name: str, value: object) -> str:
    """The message for a coordinate that is not a number. Raw Ursina's answer
    to a bad position is silence: position=(0, 0) produces no diagnostic at
    all, and the program then draws nothing."""
    return (
        f"place() needs numbers for x, y and z. The {name} it got was "
        f"{value!r}, which is a {type(value).__name__}."
    )


def place(x: object, y: object, z: object, kind: object) -> None:
    """Remember one block. Nothing is drawn until start()."""
    if _running:
        raise RuntimeError(
            "place() cannot add blocks once start() has run. start() builds "
            "the world and opens the window, so every place() call has to "
            "come before it."
        )

    if not isinstance(x, int | float):
        raise TypeError(_not_a_number("x", x))
    if not isinstance(y, int | float):
        raise TypeError(_not_a_number("y", y))
    if not isinstance(z, int | float):
        raise TypeError(_not_a_number("z", z))

    if not isinstance(kind, str) or kind not in BLOCKS:
        raise ValueError(
            f"place() does not know the block kind {kind!r}. "
            f"The kinds it knows are {sorted(BLOCKS)}."
        )

    # BLOCKS is a plain dict, so it is also a plain dict you can assign into.
    # Ursina answers BLOCKS['grass'] = 'green' with eight frames of traceback
    # ending in a complaint about hexadecimal, which is worse than useless.
    if not isinstance(BLOCKS[kind], Color):
        raise TypeError(
            f"BLOCKS[{kind!r}] is {BLOCKS[kind]!r}, which is not a color. "
            f"The colors in BLOCKS come from ursina's color module -- "
            f"color.green, color.brown, and so on. A name in quotes is not "
            f"one of them."
        )

    placed.append((x, y, z, kind))


def start() -> None:
    """Build every placed block, frame the camera on them, open the window."""
    app = Ursina()
    _running.append(app)

    ground = Entity()
    for spot in placed:
        Entity(
            parent=ground,
            model="cube",
            color=BLOCKS[spot[3]],
            position=Vec3(spot[0], spot[1], spot[2]),
        )

    if placed:
        # Fuse every block into a single mesh. One Entity per block costs one
        # draw call per block: three nested range(20) loops is 8,000 blocks
        # and measured 14.9 fps. Fused, the same program ran at 1,424 fps.
        # Deleting this one line is the Area 7 performance lesson.
        ground.combine()

        # Point the camera at the middle of whatever got placed, far enough
        # back to see all of it. Ursina ignores camera.position while an
        # EditorCamera exists, so the placing has to go through the view.
        xs = []
        ys = []
        zs = []
        for spot in placed:
            xs.append(spot[0])
            ys.append(spot[1])
            zs.append(spot[2])
        span = max([max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs)]) + 2
        view = EditorCamera()
        view.position = (
            (max(xs) + min(xs)) / 2,
            (max(ys) + min(ys)) / 2,
            (max(zs) + min(zs)) / 2,
        )
        view.target_z = -span * 2.5 - 5
        camera.z = view.target_z
    else:
        EditorCamera()

    # ursina 8.3.0 wraps Ursina in a @singleton decorator that returns a proxy
    # class, so a type checker cannot see run() on it even though it is there
    # at run time. Recorded in curriculum/lib/README.md under the pin.
    app.run()  # pyright: ignore[reportAttributeAccessIssue]
