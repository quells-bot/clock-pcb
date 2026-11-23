import type { ChipProps } from "tscircuit"

/**
 * Vishay TCRT5000 reflective sensor, drawn from the "Footprint Top View" in
 * components/tcrt5000.pdf (drawing 6.550-5096.01-4).
 *
 * Long axis is X. Detector (C, E) on the left, IR emitter (A, K) on the right.
 * The two Ø2.5 holes take the plastic mounting clips and the Ø1 hole takes the
 * locating peg, so the part only fits one way round.
 */
const pinLabels = {
  pin1: "C", // phototransistor collector
  pin2: "E", // phototransistor emitter
  pin3: "K", // IR LED cathode
  pin4: "A", // IR LED anode
} as const

/** Pin positions in the part's own frame (before pcbRotation). */
export const TCRT5000_PIN_POSITIONS = {
  C: { x: -2.75, y: 1.27 },
  E: { x: -2.75, y: -1.27 },
  K: { x: 2.75, y: -1.27 },
  A: { x: 2.75, y: 1.27 },
} as const

export const TCRT5000 = (props: ChipProps<typeof pinLabels>) => (
  <chip
    manufacturerPartNumber="TCRT5000"
    pinLabels={pinLabels}
    schPinArrangement={{
      leftSide: { pins: ["A", "K"], direction: "top-to-bottom" },
      rightSide: { pins: ["C", "E"], direction: "top-to-bottom" },
    }}
    footprint={
      <footprint>
        {(["C", "E", "K", "A"] as const).map((label, i) => (
          <platedhole
            key={label}
            portHints={[`pin${i + 1}`]}
            pcbX={TCRT5000_PIN_POSITIONS[label].x}
            pcbY={TCRT5000_PIN_POSITIONS[label].y}
            shape="circle"
            holeDiameter={0.9}
            outerDiameter={1.6}
          />
        ))}
        {/* mounting clips */}
        <hole pcbX={0} pcbY={1.9} diameter={2.5} />
        <hole pcbX={0} pcbY={-1.9} diameter={2.5} />
        {/* locating peg */}
        <hole pcbX={-4.65} pcbY={-2.45} diameter={1.0} />
        {/* 10.2 x 5.8 body, broken where the clip holes cross its long edges
            and around the locating peg in the bottom-left corner */}
        <silkscreenpath
          route={[
            { x: -1.1, y: 2.9 },
            { x: -5.1, y: 2.9 },
            { x: -5.1, y: -1.6 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: -3.8, y: -2.9 },
            { x: -1.1, y: -2.9 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: 1.1, y: 2.9 },
            { x: 5.1, y: 2.9 },
            { x: 5.1, y: -2.9 },
            { x: 1.1, y: -2.9 },
          ]}
        />
        {/* detector / emitter side marks, just outside the body above the pins */}
        <silkscreentext text="RX" pcbX={-2.75} pcbY={3.7} fontSize={0.8} />
        <silkscreentext text="IR" pcbX={2.75} pcbY={3.7} fontSize={0.8} />
      </footprint>
    }
    {...props}
  />
)
