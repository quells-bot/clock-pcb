import type { ChipProps } from "tscircuit"

/**
 * BKA30D-R5 dual-shaft stepper motor (continuous rotation, no end stops).
 *
 * Coordinates are taken from front/min-footprint.scad (fit-checked), rotated
 * 90° CW and re-origined so (0, 0) is the OUTPUT SHAFT, viewed from the dial
 * side of the board (+X right, +Y up = 12 o'clock).
 *
 *   SCAD (motor-centred) point (x, y)  ->  footprint point (y, 9.5 - x)
 *
 * The motor body sits on the BACK of the board with its shaft poking up
 * through the shaft hole. Always place it with layer="bottom".
 *
 * Pin names follow datasheet Fig. 12 (A motor near the shaft, B motor at the
 * far end). Fig. 12 does not say whether it is drawn from the shaft side or
 * the pin side, so confirm the coil pairs with a meter (~280 Ω across A1-A2,
 * A3-A4, B1-B2, B3-B4) before trusting the left/right assignment.
 */

// tscircuit mirrors X when a part is placed with layer="bottom", so the
// footprint is authored as seen from the BACK (motor side) of the board.
// Place it with layer="bottom" and it lands correctly in dial-side coordinates.
const fromScad = (x: number, y: number) => ({ x: -y, y: 9.5 - x })

// Lead holes: leads are 0.40 x 0.50 mm, so a 0.8 mm drill leaves easy clearance
const LEAD_DRILL = 0.8
const LEAD_PAD = 1.6

// Pegs are Ø2.5 (datasheet suggests a Ø3.0 hole). Deliberately oversized: the
// screws locate the board to the motor, so the pegs only need to clear.
const PEG_HOLE = 3.8
// Fit-checked shaft clearance hole
const SHAFT_HOLE = 6.8
// Optional ST2.0 self-tapping screws
const SCREW_HOLE = 2.3

// SCAD lead positions -> pin names, matching Fig. 12 read as a dial-side view.
// On the board (dial side): A1/A2 at 9 o'clock and A4/A3 at 3 o'clock near the
// shaft; B3/B4 at 9 o'clock and B2/B1 at 3 o'clock at the far end.
const leads: Array<{ pin: string; label: string; scad: [number, number] }> = [
  // A motor: the shaft end of the motor (SCAD +X side)
  { pin: "pin1", label: "A1", scad: [11.625, -11.45] },
  { pin: "pin2", label: "A2", scad: [19.375, -11.45] },
  { pin: "pin3", label: "A3", scad: [19.375, 11.45] },
  { pin: "pin4", label: "A4", scad: [11.625, 11.45] },
  // B motor: the far end (SCAD -X side)
  { pin: "pin5", label: "B1", scad: [-11.625, 11.45] },
  { pin: "pin6", label: "B2", scad: [-19.375, 11.45] },
  { pin: "pin7", label: "B3", scad: [-19.375, -11.45] },
  { pin: "pin8", label: "B4", scad: [-11.625, -11.45] },
]

const pegs: Array<[number, number]> = [
  [-25, 9.25],
  [25, 9.25],
  [0, -12],
]
const screws: Array<[number, number]> = [
  [-15.5, -13.5],
  [-15.5, 13.5],
  [15.5, -13.5],
  [15.5, 13.5],
]

// Body outline: 59.5 x 31.5 mm stadium centred on the motor (SCAD origin),
// sampled finely and broken into runs wherever it would cross a hole.
const bodyOutlineRuns = (() => {
  const r = 31.5 / 2
  const c = 59.5 / 2 - r
  const step = 0.4
  const pts: Array<{ x: number; y: number }> = []
  const arc = (cx: number, a0: number) => {
    const n = Math.ceil((Math.PI * r) / step)
    for (let i = 0; i <= n; i++) {
      const a = a0 + (Math.PI * i) / n
      pts.push({ x: cx + r * Math.cos(a), y: r * Math.sin(a) })
    }
  }
  const line = (x0: number, x1: number, y: number) => {
    const n = Math.ceil(Math.abs(x1 - x0) / step)
    for (let i = 1; i < n; i++) pts.push({ x: x0 + ((x1 - x0) * i) / n, y })
  }
  arc(c, -Math.PI / 2)
  line(c, -c, r)
  arc(-c, Math.PI / 2)
  line(-c, c, -r)
  pts.push(pts[0])

  const keepouts = [
    ...pegs.map(([x, y]) => ({ x, y, r: PEG_HOLE / 2 + 0.3 })),
    ...screws.map(([x, y]) => ({ x, y, r: SCREW_HOLE / 2 + 0.3 })),
  ]
  const clear = (q: { x: number; y: number }) =>
    keepouts.every((k) => Math.hypot(q.x - k.x, q.y - k.y) > k.r)

  const runs: Array<Array<{ x: number; y: number }>> = []
  let run: Array<{ x: number; y: number }> = []
  for (const q of pts) {
    if (clear(q)) run.push(fromScad(q.x, q.y))
    else {
      if (run.length > 1) runs.push(run)
      run = []
    }
  }
  if (run.length > 1) runs.push(run)
  return runs
})()

/** Lead positions in board (dial-side) coordinates, for planning traces. */
export const BKA30D_PIN_POSITIONS = Object.fromEntries(
  leads.map((l) => [l.label, { x: l.scad[1], y: 9.5 - l.scad[0] }]),
) as Record<"A1" | "A2" | "A3" | "A4" | "B1" | "B2" | "B3" | "B4", { x: number; y: number }>

export const pinLabels = Object.fromEntries(
  leads.map((l) => [l.pin, l.label]),
) as Record<string, string>

export const BKA30D = (props: ChipProps) => (
  <chip
    manufacturerPartNumber="BKA30D-R5"
    pinLabels={pinLabels}
    schPinArrangement={{
      leftSide: { pins: ["A1", "A2", "A3", "A4"], direction: "top-to-bottom" },
      rightSide: { pins: ["B1", "B2", "B3", "B4"], direction: "top-to-bottom" },
    }}
    footprint={
      <footprint>
        {leads.map((l) => {
          const p = fromScad(...l.scad)
          return (
            <platedhole
              key={l.pin}
              portHints={[l.pin]}
              pcbX={p.x}
              pcbY={p.y}
              shape="circle"
              holeDiameter={LEAD_DRILL}
              outerDiameter={LEAD_PAD}
            />
          )
        })}
        {pegs.map(([x, y], i) => {
          const p = fromScad(x, y)
          return <hole key={`peg${i}`} pcbX={p.x} pcbY={p.y} diameter={PEG_HOLE} />
        })}
        {screws.map(([x, y], i) => {
          const p = fromScad(x, y)
          return <hole key={`scr${i}`} pcbX={p.x} pcbY={p.y} diameter={SCREW_HOLE} />
        })}
        <hole pcbX={0} pcbY={0} diameter={SHAFT_HOLE} />
        {bodyOutlineRuns.map((route, i) => (
          <silkscreenpath key={`outline${i}`} route={route} />
        ))}
      </footprint>
    }
    {...props}
  />
)
