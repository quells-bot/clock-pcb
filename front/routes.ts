/**
 * Hand-planned trace paths for the front board.
 *
 * Every path is a polyline in BOARD coordinates (origin = shaft, dial-side
 * view), listed from the trace's `from` pin to its `to` pin, both included.
 * `pcbPathFor` chamfers the right-angle corners and converts the interior
 * points into the frame tscircuit expects: the `from` component's own frame
 * (relative to its centre, with its rotation undone).
 *
 * Everything is on the top copper layer and nothing crosses:
 *  - motor B leads run down the outside of the motor, A leads just inside;
 *  - the minute sensor's three wires come down the middle, left of the shaft;
 *  - the hour sensor's three wires come down the right edge and slip under the
 *    motor wires' corners to reach their pads;
 *  - a GND link runs under the pad row to join the two GND pads.
 */

export type Pt = { x: number; y: number }
export type Frame = { x: number; y: number; rotation: number }

const CHAMFER = 1.0

/** Replace each right-angle corner with a 45° chamfer of up to CHAMFER mm. */
const chamfer = (raw: Pt[]): Pt[] => {
  // drop repeated points so every segment has a length
  const pts = raw.filter((q, i) => i === 0 || q.x !== raw[i - 1].x || q.y !== raw[i - 1].y)
  const out: Pt[] = [pts[0]]
  for (let i = 1; i < pts.length - 1; i++) {
    const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]]
    const inAxis = a.x === b.x || a.y === b.y
    const outAxis = b.x === c.x || b.y === c.y
    const turns = (a.x === b.x) !== (b.x === c.x)
    if (!(inAxis && outAxis && turns)) {
      out.push(b)
      continue
    }
    const lenIn = Math.hypot(b.x - a.x, b.y - a.y)
    const lenOut = Math.hypot(c.x - b.x, c.y - b.y)
    const d = Math.min(CHAMFER, lenIn / 2, lenOut / 2)
    out.push({ x: b.x + ((a.x - b.x) / lenIn) * d, y: b.y + ((a.y - b.y) / lenIn) * d })
    out.push({ x: b.x + ((c.x - b.x) / lenOut) * d, y: b.y + ((c.y - b.y) / lenOut) * d })
  }
  out.push(pts[pts.length - 1])
  return out
}

/** Board-coordinate polyline -> `pcbPath` for a trace whose `from` is in `frame`. */
export const pcbPathFor = (frame: Frame, pts: Pt[]) => {
  const r = (-frame.rotation * Math.PI) / 180
  return chamfer(pts)
    .slice(1, -1)
    .map(({ x, y }) => {
      const dx = x - frame.x
      const dy = y - frame.y
      return {
        x: +(dx * Math.cos(r) - dy * Math.sin(r)).toFixed(3),
        y: +(dx * Math.sin(r) + dy * Math.cos(r)).toFixed(3),
      }
    })
}

export const p = (x: number, y: number): Pt => ({ x, y })
