import { BKA30D, BKA30D_PIN_POSITIONS as M } from "../lib/BKA30D"
import { TCRT5000, TCRT5000_PIN_POSITIONS } from "../lib/TCRT5000"
import { type Frame, p, pcbPathFor } from "./routes"

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
 *  - J1 is a row of 14 wire pads to the brain board along the 6 o'clock edge.
 */

const HOUR_SENSOR = { x: 30, y: 0 }
const MINUTE_SENSOR = { x: 0, y: 50 }

// LED drive: 220 Ω suits either rail. (3.3 V - 1.2 V) / 220 Ω ≈ 9.5 mA from
// the 3.3 V logic rail or a GPIO; (5 V - 1.25 V) / 220 Ω ≈ 17 mA from the 5 V
// motor rail (abs. max 60 mA). 1/4 W axial, 10.16 mm (0.4 in) pitch.
// Brain is a Pico 2 (RP2350): drive each LED_* pad from its own GPIO (set the
// pad to 12 mA drive strength). The SNS_* outputs are open-collector: pull them
// up to 3.3 V on the brain board.
const LED_RESISTOR = "220"

// Board extents (mm, relative to the shaft)
const LEFT = -21
const RIGHT = 37
const BOTTOM = -30
const TOP = 57

// Part placement (board coordinates; rotation in degrees)
const U1: Frame = { x: 30, y: 0, rotation: 0 } // hour sensor
const R1: Frame = { x: 30, y: -6, rotation: 0 }
const U2: Frame = { x: 0, y: 50, rotation: 90 } // minute sensor
const R2: Frame = { x: -6, y: 50, rotation: 90 }
const J1: Frame = { x: 0, y: BOTTOM + 3, rotation: 0 }

/** Where a TCRT5000 pin lands on the board. */
const sensorPin = (u: Frame, pin: keyof typeof TCRT5000_PIN_POSITIONS) => {
  const { x, y } = TCRT5000_PIN_POSITIONS[pin]
  const r = (u.rotation * Math.PI) / 180
  return p(u.x + x * Math.cos(r) - y * Math.sin(r), u.y + x * Math.sin(r) + y * Math.cos(r))
}
/** Where an axial resistor pin (pitch 10.16 mm) lands on the board. */
const resPin = (r: Frame, pin: 1 | 2) => {
  const d = (pin === 1 ? -5.08 : 5.08)
  const a = (r.rotation * Math.PI) / 180
  return p(r.x + d * Math.cos(a), r.y + d * Math.sin(a))
}

// Wire pads, left to right. Ordered to match where each wire comes from so
// that no traces cross: B3 B4 A2 A1 down the left, the minute sensor down the
// middle, A3 A4 B1 B2 down the right, then the hour sensor from the far right.
export const PAD_ORDER = [
  "B3", "B4", "A2", "A1",
  "LED_M", "SNS_M", "GND1",
  "A3", "A4", "B1", "B2",
  "SNS_H", "LED_H", "GND2",
] as const
type PadName = (typeof PAD_ORDER)[number]

const wirePads = Object.fromEntries(PAD_ORDER.map((n, i) => [`pin${i + 1}`, n]))
const pad = (n: PadName) => p(J1.x + (PAD_ORDER.indexOf(n) - (PAD_ORDER.length - 1) / 2) * 2.54, J1.y)

/** A trace from a wire pad, following a planned board-coordinate path. */
const PadTrace = ({ name, to, via }: { name: PadName; to: string; via: Array<{ x: number; y: number }> }) => {
  const start = pad(name)
  const end = via[via.length - 1]
  return (
    <trace
      name={name}
      from={`.J1 > .${name}`}
      to={to}
      pcbPath={pcbPathFor(J1, [start, p(start.x, via[0].y), ...via.slice(0, -1), end])}
    />
  )
}

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

    <TCRT5000 name="U1" pcbX={U1.x} pcbY={U1.y} pcbRotation={U1.rotation} />
    <resistor name="R1" resistance={LED_RESISTOR} footprint="axial_p0.4in_id0.8mm_od1.6mm" pcbStyle={{ silkscreenFontSize: 1 }} pcbX={R1.x} pcbY={R1.y} pcbRotation={R1.rotation} />

    <TCRT5000 name="U2" pcbX={U2.x} pcbY={U2.y} pcbRotation={U2.rotation} />
    <resistor name="R2" resistance={LED_RESISTOR} footprint="axial_p0.4in_id0.8mm_od1.6mm" pcbStyle={{ silkscreenFontSize: 1 }} pcbX={R2.x} pcbY={R2.y} pcbRotation={R2.rotation} />

    {/* Wire pads drawn by hand so the footprint carries no "J1" silkscreen
        text to crowd the pad labels */}
    <connector
      name="J1"
      pinLabels={wirePads}
      pcbX={J1.x}
      pcbY={J1.y}
      footprint={
        // wires come in from the back of the board, towards the brain board
        <footprint insertionDirection="from_below">
          {PAD_ORDER.map((n, i) => (
            <platedhole
              key={n}
              portHints={[`pin${i + 1}`]}
              pcbX={pad(n).x - J1.x}
              pcbY={0}
              shape="circle"
              holeDiameter={1}
              outerDiameter={1.8}
            />
          ))}
        </footprint>
      }
    />

    {/* Motor B leads: out and down the outside of the motor */}
    <PadTrace name="B3" to=".M1 > .B3" via={[p(-19, -21), p(-19, M.B3.y), M.B3]} />
    <PadTrace name="B4" to=".M1 > .B4" via={[p(-17.5, -19.8), p(-17.5, M.B4.y), M.B4]} />
    <PadTrace name="B1" to=".M1 > .B1" via={[p(17.5, -21), p(17.5, M.B1.y), M.B1]} />
    <PadTrace name="B2" to=".M1 > .B2" via={[p(19, -22.2), p(19, M.B2.y), M.B2]} />

    {/* Motor A leads: just inside or outside the A pins, clear of the pegs and screws */}
    <PadTrace name="A2" to=".M1 > .A2" via={[p(pad("A2").x, M.A2.y - 1), M.A2]} />
    <PadTrace name="A1" to=".M1 > .A1" via={[p(pad("A1").x, M.A1.y - 2.56), M.A1]} />
    <PadTrace name="A3" to=".M1 > .A3" via={[p(12.6, -18.6), p(12.6, M.A3.y - 1.15), M.A3]} />
    <PadTrace name="A4" to=".M1 > .A4" via={[p(16, -19.8), p(16, M.A4.y), M.A4]} />

    {/* Minute sensor (12:00): three wires down the middle, left of the shaft */}
    <PadTrace name="LED_M" to=".R2 > .pin1" via={[p(-6.35, -11.25), p(-7.6, -10), p(-7.6, resPin(R2, 1).y - 1.6), resPin(R2, 1)]} />
    <PadTrace name="SNS_M" to=".U2 > .C" via={[p(-3.81, -11.49), p(-6.3, -9), p(-6.3, 37.97), p(-1.27, 43), sensorPin(U2, "C")]} />
    <PadTrace name="GND1" to=".U2 > .E" via={[p(-1.27, -11.73), p(-5, -8), p(-5, 35.73), p(1.27, 42), sensorPin(U2, "E")]} />
    <trace
      from=".R2 > .pin2"
      to=".U2 > .A"
      pcbPath={pcbPathFor(R2, [resPin(R2, 2), p(sensorPin(U2, "A").x, resPin(R2, 2).y), sensorPin(U2, "A")])}
    />
    <trace
      from=".U2 > .K"
      to=".U2 > .E"
      pcbPath={pcbPathFor(U2, [sensorPin(U2, "K"), p(3.9, sensorPin(U2, "K").y), p(3.9, sensorPin(U2, "E").y), sensorPin(U2, "E")])}
    />

    {/* Hour sensor (3:00): three wires down the right edge, under the motor wires' corners */}
    <PadTrace name="SNS_H" to=".U1 > .C" via={[p(22.8, -23.4), p(22.8, sensorPin(U1, "C").y), sensorPin(U1, "C")]} />
    <PadTrace name="LED_H" to=".R1 > .pin1" via={[p(resPin(R1, 1).x, -24.6), resPin(R1, 1)]} />
    <PadTrace name="GND2" to=".U1 > .E" via={[p(sensorPin(U1, "E").x, -25.8), sensorPin(U1, "E")]} />
    <trace
      from=".R1 > .pin2"
      to=".U1 > .A"
      pcbPath={pcbPathFor(R1, [resPin(R1, 2), p(resPin(R1, 2).x, sensorPin(U1, "A").y), sensorPin(U1, "A")])}
    />
    <trace
      from=".U1 > .K"
      to=".U1 > .E"
      pcbPath={pcbPathFor(U1, [sensorPin(U1, "K"), p(sensorPin(U1, "K").x, -3.9), p(sensorPin(U1, "E").x, -3.9), sensorPin(U1, "E")])}
    />

    {/* Join the two GND pads under the pad row */}
    <trace
      from=".J1 > .GND1"
      to=".J1 > .GND2"
      pcbPath={pcbPathFor(J1, [pad("GND1"), p(pad("GND1").x, J1.y - 2), p(pad("GND2").x, J1.y - 2), pad("GND2")])}
    />

    {/* Pad labels, alternating between two rows so neighbours never touch */}
    {PAD_ORDER.map((n, i) => (
      <silkscreentext
        key={n}
        text={n}
        // GND2 is the last pad, so it sits beside it, in line with the holes
        pcbX={n === "GND2" ? pad(n).x + 3.4 : pad(n).x}
        pcbY={n === "GND2" ? J1.y : J1.y + (i % 2 === 0 ? 1.8 : 3.3)}
        fontSize={1}
      />
    ))}

    {/* Dial-side markings */}
    <silkscreentext text="HOUR HOME" pcbX={30} pcbY={6} fontSize={1} />
    <silkscreentext text="MIN HOME" pcbX={9} pcbY={50} fontSize={1} />

    {/* Board identifier, in the open upper-right corner */}
    <silkscreentext text="CLOCK FRONT" pcbX={27} pcbY={53} fontSize={1.2} />
    <silkscreentext text="Rev 1.0" pcbX={27} pcbY={51} fontSize={1.2} />
  </board>
)
