import type { ChipProps } from "tscircuit"
import { type ModuleSpec, ModuleSocket, pinPositions, pinRow } from "./ModuleSocket"

/**
 * Adafruit #4654 MiniBoost 5 V @ 1 A (TPS61023), in a 4-pin socket.
 *
 * From Adafruit's "Adafruit TPS61023.brd": one row along the bottom edge.
 * Onboard: 100 kΩ EN pull-up to VIN; output set to ~5.2 V.
 */
const PINS = ["EN", "VOUT", "GND", "VIN"] as const

const spec: ModuleSpec<(typeof PINS)[number]> = {
  pins: pinRow(PINS, 3.81, -6.35, -2.54, 0),
  width: 11.43,
  height: 17.78,
  title: "BOOST",
  titleAt: { x: 0, y: 1 },
}

export const MINIBOOST_PIN_POSITIONS = pinPositions(spec)

export const MiniBoost = (props: ChipProps) => (
  <ModuleSocket spec={spec} manufacturerPartNumber="Adafruit 4654" {...props} />
)
