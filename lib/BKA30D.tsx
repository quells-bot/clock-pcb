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

// Datasheet: pegs are Ø2.5 with a recommended Ø3.0 PCB hole
const PEG_HOLE = 3.0
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

// Body outline: 59.5 x 31.5 mm stadium centred on the motor (SCAD origin)
const bodyOutline = (() => {
  const r = 31.5 / 2
  const c = 59.5 / 2 - r
  const pts: Array<{ x: number; y: number }> = []
  const n = 24
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / n
    pts.push(fromScad(c + r * Math.cos(a), r * Math.sin(a)))
  }
  for (let i = 0; i <= n; i++) {
    const a = Math.PI / 2 + (Math.PI * i) / n
    pts.push(fromScad(-c + r * Math.cos(a), r * Math.sin(a)))
  }
  pts.push(pts[0])
  return pts
})()

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
        <silkscreenpath route={bodyOutline} />
      </footprint>
    }
    {...props}
  />
)
