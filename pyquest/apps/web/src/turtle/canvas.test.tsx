import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TurtleCanvas } from './TurtleCanvas';
import type { TurtleOp } from './protocol.ts';

const SQUARE: TurtleOp[] = [
  { op: 'forward', args: [100] }, { op: 'right', args: [90] },
  { op: 'forward', args: [100] }, { op: 'right', args: [90] },
  { op: 'forward', args: [100] }, { op: 'right', args: [90] },
  { op: 'forward', args: [100] }, { op: 'right', args: [90] },
];

/**
 * What can honestly be asserted about a canvas in jsdom, and nothing more.
 *
 * jsdom has no 2D context, so nothing here checks pixels — and pixels would be the wrong check
 * anyway: "a canvas that renders something is not evidence, an untouched turtle canvas already
 * holds items." The geometry is proved in `protocol.test.ts` against the stroke list. What is
 * left for this component is that it says what it is holding, and says it out loud.
 */
describe('the turtle canvas', () => {
  it('announces an empty canvas as empty rather than as a drawing', () => {
    render(<TurtleCanvas ops={[]} />);
    expect(screen.getByRole('img', { name: /nothing drawn yet/i })).toBeInTheDocument();
  });

  it('announces how many lines it is holding', () => {
    render(<TurtleCanvas ops={SQUARE} />);
    // Four sides, and the count comes from the interpreter rather than from the op list.
    expect(screen.getByRole('img', { name: 'Turtle drawing, 4 lines' })).toBeInTheDocument();
  });

  it('counts a single line in the singular', () => {
    render(<TurtleCanvas ops={[{ op: 'forward', args: [10] }]} />);
    expect(screen.getByRole('img', { name: 'Turtle drawing, 1 line' })).toBeInTheDocument();
  });

  /**
   * The property that matters when a program raises: whatever it drew before it failed is still
   * on screen. The canvas gets a partial op list and must render it as a partial drawing rather
   * than as nothing.
   */
  it('draws the part of a program that ran before it broke', () => {
    render(<TurtleCanvas ops={SQUARE.slice(0, 5)} />);
    expect(screen.getByRole('img', { name: 'Turtle drawing, 3 lines' })).toBeInTheDocument();
  });

  it('does not fall over when the context is unavailable', () => {
    // jsdom has no 2D context. A component that assumed one would throw here rather than in
    // front of him, which is the only reason this test can be written at all.
    expect(() => render(<TurtleCanvas ops={SQUARE} />)).not.toThrow();
  });
});
