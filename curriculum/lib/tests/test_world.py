"""The shim's contract, checked headlessly.

Two things are being defended here, and they are not the same thing.

**The messages.** Spec 3 principle 5 is *never hide failure*, and the Ursina
spike found raw Ursina breaking it three ways: a mistyped block name draws
nothing and says nothing, a two-element position says nothing at all, and
`color='green'` produces an eight-frame traceback ending in a complaint about
hexadecimal. The shim is a validating boundary first and a vocabulary hider
second, so every failure test below asserts on the *message*, not just on the
raise. A `ValueError` that names the fix is the feature; a bare `KeyError` is
the shim being a wrapper.

**Importability.** `import world` must be safe with no display. The Area 3
harness monkeypatches `world.start` to a recording no-op, imports each exercise
as a module, and reads `world.placed`. That only works if importing the shim
constructs nothing.

`start()` is exercised against stand-ins for `Ursina`, `Entity`,
`EditorCamera` and `camera`, because a real one needs an OpenGL context. That
is a deliberate scope reduction: these tests prove `start()` calls
`ground.combine()`, not that Panda3D fuses a mesh when it does.
`curriculum/lib/smoke.py` is the other half and runs against the real engine
with a real window.

    py -3.14 -m pytest curriculum/lib/tests -v
"""

import importlib
import re
import subprocess
import sys
import types
from pathlib import Path

import pytest

LIB = Path(__file__).resolve().parent.parent
SOURCE = LIB / "world.py"


@pytest.fixture
def world() -> types.ModuleType:
    """A freshly reloaded `world`, so no test inherits another's blocks."""
    module = importlib.import_module("world")
    return importlib.reload(module)


# --- stand-ins for the engine -------------------------------------------------


class FakeEntity:
    """Stands in for `ursina.Entity`. Records how it was constructed and
    whether anyone fused it."""

    made: list["FakeEntity"] = []

    def __init__(self, **kwargs: object) -> None:
        self.kwargs: dict[str, object] = kwargs
        self.combine_calls = 0
        FakeEntity.made.append(self)

    def combine(self) -> None:
        self.combine_calls += 1


class FakeUrsina:
    """Stands in for `ursina.Ursina`. `run()` returns instead of blocking."""

    made: list["FakeUrsina"] = []

    def __init__(self) -> None:
        self.run_calls = 0
        FakeUrsina.made.append(self)

    def run(self) -> None:
        self.run_calls += 1


class FakeEditorCamera:
    made: list["FakeEditorCamera"] = []

    def __init__(self) -> None:
        self.position: tuple[float, float, float] = (0.0, 0.0, 0.0)
        self.target_z = 0.0
        FakeEditorCamera.made.append(self)


class FakeCamera:
    def __init__(self) -> None:
        self.z = 0.0


@pytest.fixture
def engine(
    world: types.ModuleType, monkeypatch: pytest.MonkeyPatch
) -> types.ModuleType:
    """`world` with the engine replaced by recorders, so `start()` can run."""
    FakeEntity.made = []
    FakeUrsina.made = []
    FakeEditorCamera.made = []
    monkeypatch.setattr(world, "Entity", FakeEntity)
    monkeypatch.setattr(world, "Ursina", FakeUrsina)
    monkeypatch.setattr(world, "EditorCamera", FakeEditorCamera)
    monkeypatch.setattr(world, "camera", FakeCamera())
    return world


# --- importing it must not need a display -------------------------------------


def test_importing_world_constructs_no_app() -> None:
    """The Area 3 harness imports exercises as modules. If importing `world`
    built an Ursina app, that harness would need a display and importing twice
    would be an error rather than a no-op."""
    probe = "import ursina.application as a; import world; print('BASE', a.base)"
    result = subprocess.run(
        [sys.executable, "-c", probe],
        cwd=LIB,
        capture_output=True,
        text=True,
        timeout=180,
        check=False,
    )
    assert result.returncode == 0, result.stderr
    assert "BASE None" in result.stdout, result.stdout


def test_start_can_be_replaced_by_a_no_op(world: types.ModuleType) -> None:
    """The harness's actual contract: swap `start` for a recorder, run the
    learner's program, read `placed`."""
    calls: list[int] = []
    world.start = lambda: calls.append(1)

    world.place(1, 2, 3, "stone")
    world.start()

    assert calls == [1]
    assert world.placed == [(1, 2, 3, "stone")]


# --- the surface --------------------------------------------------------------


def test_it_exports_exactly_three_names(world: types.ModuleType) -> None:
    assert world.__all__ == ["BLOCKS", "place", "start"]


def test_blocks_knows_seven_kinds_with_their_colours(
    world: types.ModuleType,
) -> None:
    from ursina import color

    assert world.BLOCKS == {
        "grass": color.green,
        "dirt": color.brown,
        "stone": color.gray,
        "sand": color.yellow,
        "water": color.azure,
        "wood": color.orange,
        "glass": color.white,
    }


def test_the_source_never_says_tier(world: types.ModuleType) -> None:
    """The lexicon is Area. At Boss 7 he opens this repository and reads it."""
    assert not re.search(r"\btiers?\b", SOURCE.read_text(), re.IGNORECASE)


def test_the_source_has_no_star_import(world: types.ModuleType) -> None:
    """He reads this file at Area 4 and starts replacing it. `import *` hides
    where every name came from."""
    assert not re.search(r"^\s*from\s+\S+\s+import\s+\*", SOURCE.read_text(), re.M)


# --- place() records ----------------------------------------------------------


def test_place_records_each_block(world: types.ModuleType) -> None:
    world.place(0, 0, 0, "grass")
    world.place(1, 2, 3, "stone")

    assert world.placed == [(0, 0, 0, "grass"), (1, 2, 3, "stone")]


# --- the four failures it must catch loudly -----------------------------------


def test_place_rejects_an_unknown_kind(world: types.ModuleType) -> None:
    with pytest.raises(ValueError) as caught:
        world.place(0, 0, 0, "stnoe")

    message = str(caught.value)
    assert "'stnoe'" in message
    assert "place()" in message
    assert "['dirt', 'glass', 'grass', 'sand', 'stone', 'water', 'wood']" in message


def test_an_unknown_kind_places_nothing(world: types.ModuleType) -> None:
    with pytest.raises(ValueError):
        world.place(0, 0, 0, "stnoe")

    assert world.placed == []


@pytest.mark.parametrize(
    ("args", "name", "shown"),
    [
        (("left", 0, 0, "grass"), "x", "'left'"),
        ((0, "up", 0, "grass"), "y", "'up'"),
        ((0, 0, None, "grass"), "z", "None"),
    ],
)
def test_place_rejects_a_non_numeric_coordinate(
    world: types.ModuleType,
    args: tuple[object, object, object, str],
    name: str,
    shown: str,
) -> None:
    """Raw Ursina's answer to a bad position is silence -- `position=(0, 0)`
    produces no diagnostic at all. The message has to name which coordinate."""
    with pytest.raises(TypeError) as caught:
        world.place(*args)

    message = str(caught.value)
    assert "place()" in message
    assert name in message
    assert shown in message
    assert world.placed == []


def test_place_rejects_a_kind_whose_colour_was_overwritten(
    world: types.ModuleType,
) -> None:
    """`BLOCKS` is a plain dict he can read -- and therefore a plain dict he can
    assign into. `BLOCKS['grass'] = 'green'` is the obvious guess, and raw
    Ursina answers it with eight frames ending in a complaint about
    hexadecimal."""
    world.BLOCKS["grass"] = "green"

    with pytest.raises(TypeError) as caught:
        world.place(0, 0, 0, "grass")

    message = str(caught.value)
    assert "BLOCKS" in message
    assert "'grass'" in message
    assert "'green'" in message
    assert "colour" in message


def test_place_after_start_says_why(engine: types.ModuleType) -> None:
    """Raw Ursina's answer here is a silent no-op."""
    engine.place(0, 0, 0, "grass")
    engine.start()

    with pytest.raises(RuntimeError) as caught:
        engine.place(1, 0, 0, "grass")

    message = str(caught.value)
    assert "place()" in message
    assert "start()" in message
    assert engine.placed == [(0, 0, 0, "grass")]


# --- start() ------------------------------------------------------------------


def test_start_fuses_the_placed_blocks_into_one_mesh(
    engine: types.ModuleType,
) -> None:
    """The whole performance argument. One Entity per block measured 14.9 fps
    on an 8,000-block world; fused, the same program ran at 1,424 fps."""
    engine.place(0, 0, 0, "grass")
    engine.place(1, 0, 0, "dirt")
    engine.start()

    ground = FakeEntity.made[0]
    assert ground.combine_calls == 1


def test_start_builds_one_entity_per_block_parented_to_the_ground(
    engine: types.ModuleType,
) -> None:
    from ursina import color

    engine.place(1, 2, 3, "stone")
    engine.start()

    ground, block = FakeEntity.made
    assert block.kwargs["parent"] is ground
    assert block.kwargs["model"] == "cube"
    assert block.kwargs["color"] == color.gray
    assert block.kwargs["position"] == (1, 2, 3)


def test_start_opens_the_window(engine: types.ModuleType) -> None:
    engine.place(0, 0, 0, "grass")
    engine.start()

    assert [app.run_calls for app in FakeUrsina.made] == [1]


def test_start_frames_the_camera_on_the_middle_of_what_was_placed(
    engine: types.ModuleType,
) -> None:
    """Raw Ursina silently ignores `camera.position` when an EditorCamera
    exists, so *"I placed blocks and see nothing"* has no Area 3 diagnosis.
    Auto-framing removes the failure mode."""
    engine.place(0, 0, 0, "grass")
    engine.place(10, 4, 2, "dirt")
    engine.start()

    view = FakeEditorCamera.made[0]
    assert view.position == (5, 2, 1)
    assert view.target_z == -(10 + 2) * 2.5 - 5
    assert engine.camera.z == view.target_z


def test_start_with_nothing_placed_still_opens_a_window(
    engine: types.ModuleType,
) -> None:
    """An empty world is a beginner's first run, not an error."""
    engine.start()

    assert [app.run_calls for app in FakeUrsina.made] == [1]
    assert all(entity.combine_calls == 0 for entity in FakeEntity.made)
