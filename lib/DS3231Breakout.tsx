import type { ChipProps } from "tscircuit"
import { type ModuleSpec, ModuleSocket, pinPositions, pinRow } from "./ModuleSocket"

/**
 * Adafruit #5188 DS3231 precision RTC (STEMMA QT version), in an 8-pin socket.
 *
 * From Adafruit's "Adafruit DS3231 STEMMA QT.brd": one row along the bottom
 * edge. Onboard: 10 kΩ SCL/SDA pull-ups to VIN, 50 kΩ RST pull-up inside the
 * chip. SQW and 32K are open drain with NO pull-up. CR1220 holder on the back.
 */
const PINS = ["VIN", "GND", "SCL", "SDA", "BAT", "32K", "SQW", "RST"] as const

const spec: ModuleSpec<(typeof PINS)[number]> = {
  pins: pinRow(PINS, -8.89, -6.35, 2.54, 0),
  width: 25.4,
  height: 17.78,
  named: ["VIN", "RST"],
  title: "DS3231 RTC",
  titleAt: { x: 0, y: 2 },
}

export const DS3231_PIN_POSITIONS = pinPositions(spec)

export const DS3231Breakout = (props: ChipProps) => (
  <ModuleSocket spec={spec} manufacturerPartNumber="Adafruit 5188" {...props} />
)
