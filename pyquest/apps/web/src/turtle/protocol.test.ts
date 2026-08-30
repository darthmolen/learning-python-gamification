import { describe, expect, it } from 'vitest';
import { SHAPES, interpret, type TurtleOp } from './protocol.ts';

const op = (name: string, ...args: (number | string)[]): TurtleOp =>
  ({ op: name, args } as TurtleOp);

/** `forward(100); right(90)` four times — the square from the plan's acceptance criterion. */
const SQUARE: TurtleOp[] = [
  op('forward', 100), op('right', 90),
  op('forward', 100), op('right', 90),
  op('forward', 100), op('right', 90),
  op('forward', 100), op('right', 90),
];

const at = (x: number, y: number) => ({ x: expect.closeTo(x, 6), y: expect.closeTo(y, 6) });

/**
 * §8's shim, tested where it can actually be tested.
 *
 * The Python side records *intent* — one entry per turtle call — and this interpreter turns
 * intent into strokes. That split is what makes the geometry assertable without Pyodide, a
 * canvas, or a browser: the thing most likely to be wrong is the arithmetic, and the arithmetic
 * is now a pure function over a list.
 *
 * "A canvas that renders something is not evidence — an untouched turtle canvas already holds
 * items, which the Area 0 harness learned the hard way." So nothing here looks at pixels.
 */
describe('drawing a square', () => {
  it('produces exactly four strokes', () => {
    expect(interpret(SQUARE).strokes).toHaveLength(4);
  });

  it('puts them at the right coordinates, and closes the shape', () => {
    const strokes = interpret(SQUARE).strokes;

    // Turtle starts at the origin facing east; `right` turns clockwise, y grows upward.
    expect(strokes[0]).toMatchObject({ from: at(0, 0), to: at(100, 0) });
    expect(strokes[1]).toMatchObject({ from: at(100, 0), to: at(100, -100) });
    expect(strokes[2]).toMatchObject({ from: at(100, -100), to: at(0, -100) });
    expect(strokes[3]).toMatchObject({ from: at(0, -100), to: at(0, 0) });
  });
});

describe('the pen', () => {
  it('draws nothing while it is up, but still moves', () => {
    const strokes = interpret([op('penup'), op('forward', 50), op('pendown'), op('forward', 50)]).strokes;

    expect(strokes).toHaveLength(1);
    expect(strokes[0]).toMatchObject({ from: at(50, 0), to: at(100, 0) });
  });

  it('carries the width and colour set before the stroke', () => {
    const strokes = interpret([op('pensize', 4), op('pencolor', 'red'), op('forward', 10)]).strokes;

    expect(strokes[0]).toMatchObject({ width: 4, color: 'red' });
  });

  it('leaves earlier strokes on their original colour when it changes', () => {
    const strokes = interpret([
      op('pencolor', 'red'), op('forward', 10),
      op('pencolor', 'blue'), op('forward', 10),
    ]).strokes;

    expect(strokes[0]?.color).toBe('red');
    expect(strokes[1]?.color).toBe('blue');
  });
});

describe('turning and moving', () => {
  it('turns left counterclockwise and right clockwise', () => {
    expect(interpret([op('left', 90), op('forward', 10)]).strokes[0]).toMatchObject({ to: at(0, 10) });
    expect(interpret([op('right', 90), op('forward', 10)]).strokes[0]).toMatchObject({ to: at(0, -10) });
  });

  it('goes backward without turning round', () => {
    expect(interpret([op('backward', 10)]).strokes[0]).toMatchObject({ from: at(0, 0), to: at(-10, 0) });
  });

  it('goes to an absolute point, drawing on the way', () => {
    expect(interpret([op('goto', 30, 40)]).strokes[0]).toMatchObject({ from: at(0, 0), to: at(30, 40) });
  });

  it('draws a circle as many short strokes that come back to the start', () => {
    const strokes = interpret([op('circle', 50)]).strokes;

    expect(strokes.length).toBeGreaterThan(8);
    const last = strokes[strokes.length - 1];
    expect(last?.to.x).toBeCloseTo(0, 3);
    expect(last?.to.y).toBeCloseTo(0, 3);
  });
});

/**
 * The no-ops matter as much as the drawing. Area 0 and 1 exercises are copied from turtle
 * tutorials, and every one of them ends with `done()` — if that raises, his first program
 * fails on its last line for a reason he cannot possibly diagnose.
 */
describe('the calls that do nothing', () => {
  it.each(['speed', 'done', 'exitonclick'])('accepts %s without drawing', (name) => {
    expect(interpret([op('forward', 10), op(name, 0)]).strokes).toHaveLength(1);
  });

  it('ignores an op it does not know rather than throwing', () => {
    // A learner reaching for a turtle function the shim lacks should get a missing drawing,
    // never a crash that looks like his fault.
    expect(() => interpret([op('shapesize', 2), op('forward', 10)]).strokes).not.toThrow();
    expect(interpret([op('shapesize', 2), op('forward', 10)]).strokes).toHaveLength(1);
  });
});

/**
 * The turtle is an arrow on screen, and the name is the ghost of a robot: Logo's turtle was a
 * dome-shaped machine that crawled over paper with a pen in its belly. Papert's argument for it
 * was *body-syntonic* reasoning — you can work out why your square came out wrong by standing
 * up and walking it. That is why `forward(100); right(90)` beats `draw_line(0, 0, 100, 0)` for
 * an 11–14-year-old, and why the marker matters at all.
 */
describe('the marker', () => {
  it('ends where the turtle ended, facing where it faced', () => {
    const { marker } = interpret([op('forward', 100), op('right', 90), op('forward', 50)]);

    expect(marker.at.x).toBeCloseTo(100, 6);
    expect(marker.at.y).toBeCloseTo(-50, 6);
    expect(marker.heading).toBe(-90);
  });

  it('wears the arrow by default, as Python does', () => {
    expect(interpret([]).marker.shape).toBe('classic');
  });

  it("wears the real turtle when asked, and it is Python's own polygon", () => {
    expect(interpret([op('shape', 'turtle')]).marker.shape).toBe('turtle');
    // Copied verbatim from the standard library. A shim's turtle that is not *the* turtle is a
    // lie in the one place a learner is most likely to look closely.
    expect(SHAPES.turtle[0]).toEqual([0, 16]);
    expect(SHAPES.turtle).toHaveLength(24);
  });

  it('has a dragon in it', () => {
    // Not a Python shape. Legal anyway: `register_shape()` is a real turtle API, so the same
    // dragon can be registered on his own machine. Undocumented on purpose.
    expect(interpret([op('shape', 'dragon')]).marker.shape).toBe('dragon');
    expect(SHAPES.dragon.length).toBeGreaterThan(12);
  });

  it('keeps the current shape when asked for one it does not have', () => {
    // Real turtle raises here. The shim does not: the cost of being right is his program dying
    // on a cosmetic line, which is a bad trade in Area 0.
    const { marker } = interpret([op('shape', 'turtle'), op('shape', 'wyvern')]);
    expect(marker.shape).toBe('turtle');
  });

  it('hides and shows the turtle without losing which shape it was', () => {
    expect(interpret([op('shape', 'dragon'), op('hideturtle')]).marker.shape).toBe('blank');
    const shown = interpret([op('shape', 'dragon'), op('hideturtle'), op('showturtle')]);
    expect(shown.marker.shape).toBe('classic');
  });
});
