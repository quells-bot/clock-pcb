import { Fragment } from "react"
import type { ChipProps } from "tscircuit"
import { type ModuleSpec, ModuleSocket, pinPositions, pinRow } from "./ModuleSocket"

/**
 * Raspberry Pi Pico 2 (RP2350) in 2 x 20 female headers.
 *
 * Standard Pico form factor: 21 x 51 mm, rows 17.78 mm apart, USB at +Y.
 * Pins 1-20 run down the left side from the USB end, pins 21-40 run back up
 * the right side, so pin 40 (VBUS) is opposite pin 1 (GP0).
 * The four Ø2.1 holes take optional M2 screws through the module.
 */
const LEFT = ["GP0", "GP1", "GND1", "GP2", "GP3", "GP4", "GP5", "GND2", "GP6", "GP7",
  "GP8", "GP9", "GND3", "GP10", "GP11", "GP12", "GP13", "GND4", "GP14", "GP15"] as const
const RIGHT = ["GP16", "GP17", "GND5", "GP18", "GP19", "GP20", "GP21", "GND6", "GP22", "RUN",
  "GP26", "GP27", "AGND", "GP28", "ADC_VREF", "3V3", "3V3_EN", "GND7", "VSYS", "VBUS"] as const

const MOUNT = [[-5.7, -23.5], [5.7, -23.5], [-5.7, 23.5], [5.7, 23.5]]

const spec: ModuleSpec<(typeof LEFT)[number] | (typeof RIGHT)[number]> = {
  pins: [...pinRow(LEFT, -8.89, 24.13, 0, -2.54), ...pinRow(RIGHT, 8.89, -24.13, 0, 2.54)],
  width: 21,
  height: 51,
  title: "PICO 2",
  extras: (
    <>
      {MOUNT.map(([x, y]) => (
        <Fragment key={`${x},${y}`}>
          <hole pcbX={x} pcbY={y} diameter={2.1} />
        </Fragment>
      ))}
      <silkscreentext text="USB" pcbX={0} pcbY={20.5} fontSize={1.2} />
      <silkscreenpath route={[{ x: -1.5, y: 22 }, { x: 0, y: 23.5 }, { x: 1.5, y: 22 }]} />
    </>
  ),
}

export const PICO2_PIN_POSITIONS = pinPositions(spec)

export const Pico2 = (props: ChipProps) => (
  <ModuleSocket spec={spec} manufacturerPartNumber="Raspberry Pi Pico 2" {...props} />
)
