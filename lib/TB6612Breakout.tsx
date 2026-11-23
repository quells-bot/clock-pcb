import type { ChipProps } from "tscircuit"
import { type ModuleSpec, ModuleSocket, pinPositions, pinRow } from "./ModuleSocket"

/**
 * Adafruit #2448 TB6612 1.2 A motor driver breakout, in sockets.
 *
 * From Adafruit's "Adafruit TB6612.brd": a 10-pin logic/power row on the left
 * and a 6-pin motor row on the right, 15.24 mm apart (not a symmetric 2x8).
 * Onboard: 10 kΩ STBY pull-up to VCC, 10 µF on VCC, reverse-polarity FET on VM.
 * The screw terminal and 2.5 mm mounting holes are unused here.
 */
const LOGIC = ["VM", "VCC", "GND1", "PWMB", "BIN2", "BIN1", "STBY", "AIN1", "AIN2", "PWMA"] as const
const MOTOR = ["MOTORA1", "MOTORA2", "GND2", "GND3", "MOTORB2", "MOTORB1"] as const

const spec: ModuleSpec<(typeof LOGIC)[number] | (typeof MOTOR)[number]> = {
  pins: [...pinRow(LOGIC, -6.985, 11.43, 0, -2.54), ...pinRow(MOTOR, 8.255, -6.35, 0, 2.54)],
  width: 19.05,
  height: 26.67,
  title: "TB6612",
  titleAt: { x: 0.6, y: 0 },
}

export const TB6612_PIN_POSITIONS = pinPositions(spec)

export const TB6612Breakout = (props: ChipProps) => (
  <ModuleSocket spec={spec} manufacturerPartNumber="Adafruit 2448" {...props} />
)
