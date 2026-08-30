/**
 * The turtle protocol: what the Python side records, and how it becomes strokes.
 *
 * §8 — turtle does not render in Pyodide unaided, and Areas 0 and 1 are turtle graphics start
 * to finish. Six weeks of text-only drills would lose a learner who chose creative art as an
 * interest, so this is on the *curriculum's* critical path rather than the app's.
 *
 * **The split is the design.** The Python module records intent — one entry per turtle call,
 * no arithmetic — and this module turns intent into strokes. That puts every piece of geometry
 * in a pure function over a list, testable with no Pyodide, no canvas and no browser. The
 * alternative, computing positions in Python and shipping coordinates, would put the part most
 * likely to be wrong in the part hardest to test.
 *
 * It also means a program that raises halfway through still has every op it managed to record,
 * so the drawing it got to keep is the drawing on screen.
 */

export interface TurtleOp {
  op: string;
  args: (number | string)[];
}

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  from: Point;
  to: Point;
  width: number;
  color: string;
}

/** How many segments approximate a full circle. Enough that a 200px circle reads as round. */
const CIRCLE_SEGMENTS = 36;

const num = (v: number | string | undefined, fallback = 0): number =>
  typeof v === 'number' ? v : fallback;

/**
 * Turtle convention, not screen convention: the turtle starts at the origin facing **east**,
 * `left` turns counterclockwise, and **y grows upward**. The renderer flips y for the canvas —
 * doing it here would make every coordinate in every test disagree with every turtle tutorial
 * he will read, and the tutorials are not going to change.
 */
export function interpret(ops: readonly TurtleOp[]): Stroke[] {
  const strokes: Stroke[] = [];

  let x = 0;
  let y = 0;
  let heading = 0;
  let down = true;
  let width = 1;
  let color = '#e8ecf2';

  const moveTo = (nx: number, ny: number) => {
    if (down) strokes.push({ from: { x, y }, to: { x: nx, y: ny }, width, color });
    x = nx;
    y = ny;
  };

  const advance = (distance: number) => {
    const radians = (heading * Math.PI) / 180;
    moveTo(x + distance * Math.cos(radians), y + distance * Math.sin(radians));
  };

  for (const { op, args } of ops) {
    switch (op) {
      case 'forward':
      case 'fd':
        advance(num(args[0]));
        break;
      case 'backward':
      case 'back':
      case 'bk':
        advance(-num(args[0]));
        break;
      case 'left':
      case 'lt':
        heading += num(args[0]);
        break;
      case 'right':
      case 'rt':
        heading -= num(args[0]);
        break;
      case 'setheading':
      case 'seth':
        heading = num(args[0]);
        break;
      case 'goto':
      case 'setpos':
      case 'setposition':
        moveTo(num(args[0]), num(args[1]));
        break;
      case 'home':
        moveTo(0, 0);
        heading = 0;
        break;
      case 'penup':
      case 'pu':
      case 'up':
        down = false;
        break;
      case 'pendown':
      case 'pd':
      case 'down':
        down = true;
        break;
      case 'pensize':
      case 'width':
        width = num(args[0], width);
        break;
      case 'pencolor':
      case 'color':
        color = typeof args[0] === 'string' ? args[0] : color;
        break;
      case 'circle':
        circle(num(args[0]), advance, (a) => {
          heading += a;
        });
        break;
      /*
       * The no-ops. Every Area 0 and 1 exercise is copied from a turtle tutorial and every one
       * of them ends in `done()`; if that raised, his first program would fail on its last line
       * for a reason he could not possibly diagnose.
       */
      case 'speed':
      case 'done':
      case 'exitonclick':
      case 'mainloop':
      case 'hideturtle':
      case 'showturtle':
      case 'title':
        break;
      /*
       * Anything else is ignored on purpose. A learner reaching for a turtle function this shim
       * does not have should get a missing drawing, never a crash that reads as his mistake.
       */
      default:
        break;
    }
  }

  return strokes;
}

/**
 * A circle as `CIRCLE_SEGMENTS` chords, which is how the real turtle draws one too. Walking the
 * polygon rather than computing the arc keeps the pen, the heading and the finishing position
 * consistent with every other op — and leaves the turtle back where it started, facing the way
 * it started.
 */
function circle(radius: number, advance: (d: number) => void, turn: (angle: number) => void) {
  const step = (2 * Math.PI * radius) / CIRCLE_SEGMENTS;
  const angle = 360 / CIRCLE_SEGMENTS;

  for (let i = 0; i < CIRCLE_SEGMENTS; i++) {
    turn(angle / 2);
    advance(step);
    turn(angle / 2);
  }
}
