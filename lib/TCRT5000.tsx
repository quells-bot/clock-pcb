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
        <platedhole portHints={["pin1"]} pcbX={-2.75} pcbY={1.27} shape="circle" holeDiameter={0.9} outerDiameter={1.6} />
        <platedhole portHints={["pin2"]} pcbX={-2.75} pcbY={-1.27} shape="circle" holeDiameter={0.9} outerDiameter={1.6} />
        <platedhole portHints={["pin3"]} pcbX={2.75} pcbY={-1.27} shape="circle" holeDiameter={0.9} outerDiameter={1.6} />
        <platedhole portHints={["pin4"]} pcbX={2.75} pcbY={1.27} shape="circle" holeDiameter={0.9} outerDiameter={1.6} />
        {/* mounting clips */}
        <hole pcbX={0} pcbY={1.9} diameter={2.5} />
        <hole pcbX={0} pcbY={-1.9} diameter={2.5} />
        {/* locating peg */}
        <hole pcbX={-4.65} pcbY={-2.45} diameter={1.0} />
        {/* 10.2 x 5.8 body */}
        <silkscreenpath
          route={[
            { x: -5.1, y: -2.9 },
            { x: 5.1, y: -2.9 },
            { x: 5.1, y: 2.9 },
            { x: -5.1, y: 2.9 },
            { x: -5.1, y: -2.9 },
          ]}
        />
        <silkscreentext text="RX" pcbX={-4.0} pcbY={0.6} fontSize={0.8} />
        <silkscreentext text="IR" pcbX={4.1} pcbY={0} fontSize={0.8} />
      </footprint>
    }
    {...props}
  />
)
