import { useEffect, useRef } from 'react';
import { color } from '../design/tokens';
import { interpret, type Stroke, type TurtleOp } from './protocol.ts';

/**
 * Draws what the turtle recorded.
 *
 * The canvas is the one part of this shim a test cannot meaningfully check — "a canvas that
 * renders something is not evidence; an untouched turtle canvas already holds items", which the
 * Area 0 harness learned the hard way. So this component is kept as thin as it can be: it owns
 * no geometry, makes no decisions, and every question worth asking has already been answered by
 * `interpret` and asserted against the protocol.
 *
 * It also renders the stroke list as text for a screen reader, because a drawing with no
 * accessible name is a drawing that announces as nothing at all.
 */

const PADDING = 24;

interface TurtleCanvasProps {
  ops: readonly TurtleOp[];
  width?: number;
  height?: number;
}

/** Fit the drawing to the canvas: turtle coordinates are unbounded and centred on the origin. */
function fit(strokes: readonly Stroke[], width: number, height: number) {
  if (strokes.length === 0) return { scale: 1, dx: width / 2, dy: height / 2 };

  const xs = strokes.flatMap((s) => [s.from.x, s.to.x]);
  const ys = strokes.flatMap((s) => [s.from.y, s.to.y]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const scale = Math.min((width - PADDING * 2) / spanX, (height - PADDING * 2) / spanY, 1);

  return {
    scale,
    dx: width / 2 - ((minX + maxX) / 2) * scale,
    dy: height / 2 + ((minY + maxY) / 2) * scale,
  };
}

export function TurtleCanvas({ ops, width = 520, height = 360 }: TurtleCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const strokes = interpret(ops);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d') ?? null;
    if (canvas === null || ctx === null) return;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = color.bg;
    ctx.fillRect(0, 0, width, height);

    const { scale, dx, dy } = fit(strokes, width, height);

    for (const stroke of strokes) {
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = Math.max(stroke.width * scale, 1);
      ctx.lineCap = 'round';
      // y is flipped here and only here: turtle grows upward, canvas grows downward. Doing it
      // in `interpret` would put every test's coordinates at odds with every turtle tutorial.
      ctx.moveTo(stroke.from.x * scale + dx, -stroke.from.y * scale + dy);
      ctx.lineTo(stroke.to.x * scale + dx, -stroke.to.y * scale + dy);
      ctx.stroke();
    }
  }, [strokes, width, height]);

  return (
    <div>
      <canvas
        ref={ref}
        width={width}
        height={height}
        role="img"
        aria-label={
          strokes.length === 0
            ? 'Turtle canvas, nothing drawn yet'
            : `Turtle drawing, ${strokes.length} ${strokes.length === 1 ? 'line' : 'lines'}`
        }
        style={{ border: `1px solid ${color.border}`, background: color.bg, display: 'block' }}
      />
    </div>
  );
}
