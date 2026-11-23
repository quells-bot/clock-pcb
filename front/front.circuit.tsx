import { BKA30D } from "../lib/BKA30D"
import { TCRT5000 } from "../lib/TCRT5000"

/**
 * Front (motor + hand-sensor) board.
 *
 * Origin (0, 0) is the clock's centre = the motor's output shaft, viewed from
 * the dial side. +Y is 12 o'clock, +X is 3 o'clock.
 *
 *  - Motor M1 sits on the back of the board, shaft up through the centre hole.
 *  - U1 (hour home) looks up through a dial window at 3 o'clock, 30 mm out.
 *  - U2 (minute home) looks up through a dial window at 12 o'clock, 50 mm out.
 *  - Both sensors face the dial with their long axis pointing at the shaft,
 *    so a radial white hand covers the emitter and detector lenses together.
 *  - J1 is a row of wire pads to the brain board along the 6 o'clock edge.
 */

const HOUR_SENSOR = { x: 30, y: 0 }
const MINUTE_SENSOR = { x: 0, y: 50 }

// LED supply assumed 5 V: (5 V - 1.25 V) / 330 Ω ≈ 11 mA
const LED_RESISTOR = "330"

// Board extents (mm, relative to the shaft)
const LEFT = -26
const RIGHT = 37
const BOTTOM = -30
const TOP = 57

const wirePads = {
  pin1: "GND1",
  pin2: "A1",
  pin3: "A2",
  pin4: "A3",
  pin5: "A4",
  pin6: "B1",
  pin7: "B2",
  pin8: "B3",
  pin9: "B4",
  pin10: "LED",
  pin11: "SNS_M",
  pin12: "SNS_H",
  pin13: "GND2",
} as const

export default () => (
  <board
    outline={[
      { x: LEFT, y: BOTTOM },
      { x: RIGHT, y: BOTTOM },
      { x: RIGHT, y: TOP },
      { x: LEFT, y: TOP },
    ]}
    layers={2}
    defaultTraceWidth="0.3mm"
  >
    <BKA30D name="M1" pcbX={0} pcbY={0} layer="bottom" />

    <TCRT5000 name="U1" pcbX={HOUR_SENSOR.x} pcbY={HOUR_SENSOR.y} pcbRotation={0} />
    <resistor name="R1" resistance={LED_RESISTOR} footprint="0805" pcbX={30} pcbY={-6} />

    <TCRT5000 name="U2" pcbX={MINUTE_SENSOR.x} pcbY={MINUTE_SENSOR.y} pcbRotation={90} />
    <resistor name="R2" resistance={LED_RESISTOR} footprint="0805" pcbX={-6} pcbY={50} pcbRotation={90} />

    <connector
      name="J1"
      footprint="pinrow13_p2.54mm_id1mm_od1.8mm"
      pinLabels={wirePads}
      pcbX={0}
      pcbY={BOTTOM + 3}
    />

    {/* Motor coils straight out to the wire pads */}
    {(["A1", "A2", "A3", "A4", "B1", "B2", "B3", "B4"] as const).map((p) => (
      <trace key={p} from={`.M1 > .${p}`} to={`.J1 > .${p}`} />
    ))}

    {/* Hour sensor */}
    <trace from=".J1 > .LED" to=".R1 > .pin1" />
    <trace from=".R1 > .pin2" to=".U1 > .A" />
    <trace from=".U1 > .K" to="net.GND" />
    <trace from=".U1 > .E" to="net.GND" />
    <trace from=".U1 > .C" to=".J1 > .SNS_H" />

    {/* Minute sensor */}
    <trace from=".J1 > .LED" to=".R2 > .pin1" />
    <trace from=".R2 > .pin2" to=".U2 > .A" />
    <trace from=".U2 > .K" to="net.GND" />
    <trace from=".U2 > .E" to="net.GND" />
    <trace from=".U2 > .C" to=".J1 > .SNS_M" />

    <trace from=".J1 > .GND1" to="net.GND" />
    <trace from=".J1 > .GND2" to="net.GND" />

    {/* Dial-side markings */}
    <silkscreentext text="HOUR HOME (3:00)" pcbX={30} pcbY={6} fontSize={1} />
    <silkscreentext text="MIN HOME (12:00)" pcbX={11} pcbY={50} fontSize={1} />
    <silkscreenline x1={-2} y1={0} x2={2} y2={0} strokeWidth={0.15} />
    <silkscreenline x1={0} y1={-2} x2={0} y2={2} strokeWidth={0.15} />
  </board>
)
