import { describe, expect, test } from "bun:test"
import type { ReactElement } from "react"
import { DS3231Breakout } from "../lib/DS3231Breakout"
import { MiniBoost } from "../lib/MiniBoost"
import { Pico2 } from "../lib/Pico2"
import { TB6612Breakout } from "../lib/TB6612Breakout"
import { renderCircuit } from "./helpers/netlist"

type Pos = Record<string, [number, number]>

// Expected header positions (mm, module outline centre, module face up, top
// view), copied from the plan's "Module header geometry" section, which was
// read from Adafruit's Eagle files and the Pico form factor.
const row = (labels: string[], x: (i: number) => number, y: (i: number) => number): Pos =>
  Object.fromEntries(labels.map((l, i) => [l, [x(i), y(i)]]))

const PICO_LEFT = ["GP0", "GP1", "GND1", "GP2", "GP3", "GP4", "GP5", "GND2", "GP6", "GP7",
  "GP8", "GP9", "GND3", "GP10", "GP11", "GP12", "GP13", "GND4", "GP14", "GP15"]
const PICO_RIGHT = ["GP16", "GP17", "GND5", "GP18", "GP19", "GP20", "GP21", "GND6", "GP22", "RUN",
  "GP26", "GP27", "AGND", "GP28", "ADC_VREF", "3V3", "3V3_EN", "GND7", "VSYS", "VBUS"]
const PICO: Pos = {
  ...row(PICO_LEFT, () => -8.89, (i) => 24.13 - 2.54 * i),
  ...row(PICO_RIGHT, () => 8.89, (i) => -24.13 + 2.54 * i),
}
const TB6612: Pos = {
  ...row(["VM", "VCC", "GND1", "PWMB", "BIN2", "BIN1", "STBY", "AIN1", "AIN2", "PWMA"],
    () => -6.985, (i) => 11.43 - 2.54 * i),
  ...row(["MOTORA1", "MOTORA2", "GND2", "GND3", "MOTORB2", "MOTORB1"],
    () => 8.255, (i) => -6.35 + 2.54 * i),
}
const MINIBOOST: Pos = row(["EN", "VOUT", "GND", "VIN"], (i) => 3.81 - 2.54 * i, () => -6.35)
const DS3231: Pos = row(["VIN", "GND", "SCL", "SDA", "BAT", "32K", "SQW", "RST"],
  (i) => -8.89 + 2.54 * i, () => -6.35)

const render = (part: ReactElement) =>
  renderCircuit(<board width="80mm" height="80mm">{part}</board>) as any[]

/** label -> [x, y] of every pcb_port on the only component, plus hole/pad stats. */
const portsOf = (cj: any[]) => {
  const names = new Map(cj.filter((e) => e.type === "source_port").map((p) => [p.source_port_id, p.name]))
  return Object.fromEntries(
    cj.filter((e) => e.type === "pcb_port").map((p) => [names.get(p.source_port_id), [p.x, p.y]]),
  ) as Pos
}

const cases: Array<[string, ReactElement, Pos, number]> = [
  ["Pico 2", <Pico2 name="U1" />, PICO, 40],
  ["TB6612", <TB6612Breakout name="U2" />, TB6612, 16],
  ["MiniBoost", <MiniBoost name="U4" />, MINIBOOST, 4],
  ["DS3231", <DS3231Breakout name="U5" />, DS3231, 8],
]

describe.each(cases)("%s socket", (_name, part, expected, count) => {
  const cj = render(part)

  test("has one socket hole per header pin", () => {
    expect(cj.filter((e) => e.type === "pcb_plated_hole").length).toBe(count)
  })

  test("every pin sits where the module's header pin is", () => {
    const ports = portsOf(cj)
    expect(Object.keys(ports).sort()).toEqual(Object.keys(expected).sort())
    for (const [label, [x, y]] of Object.entries(expected)) {
      expect(ports[label][0]).toBeCloseTo(x, 2)
      expect(ports[label][1]).toBeCloseTo(y, 2)
    }
  })

  test("uses 1.0 mm drill, 1.7 mm pad socket holes", () => {
    for (const h of cj.filter((e) => e.type === "pcb_plated_hole")) {
      expect(h.hole_diameter).toBeCloseTo(1.0, 3)
      expect(h.outer_diameter).toBeCloseTo(1.7, 3)
    }
  })

  test("has no SMD pads", () => {
    expect(cj.filter((e) => e.type === "pcb_smtpad").length).toBe(0)
  })
})

test("spot checks from the plan", () => {
  const pico = portsOf(render(<Pico2 name="U1" />))
  expect(pico.GP0).toEqual([-8.89, 24.13])
  expect(pico.VBUS[0]).toBeCloseTo(8.89, 2)
  expect(pico.VBUS[1]).toBeCloseTo(24.13, 2)
  expect(pico.VSYS[1]).toBeCloseTo(21.59, 2)
  const tb = portsOf(render(<TB6612Breakout name="U2" />))
  expect(tb.VM[0]).toBeCloseTo(-6.985, 2)
  expect(tb.VM[1]).toBeCloseTo(11.43, 2)
  expect(tb.PWMA[1]).toBeCloseTo(-11.43, 2)
  expect(tb.MOTORA1[0]).toBeCloseTo(8.255, 2)
  expect(tb.MOTORA1[1]).toBeCloseTo(-6.35, 2)
  const mb = portsOf(render(<MiniBoost name="U4" />))
  expect(mb.EN[0]).toBeCloseTo(3.81, 2)
  expect(mb.VIN[0]).toBeCloseTo(-3.81, 2)
  const rtc = portsOf(render(<DS3231Breakout name="U5" />))
  expect(rtc.VIN[0]).toBeCloseTo(-8.89, 2)
  expect(rtc.SQW[0]).toBeCloseTo(6.35, 2)
})

test("Pico mounting holes are 2.1 mm at (±5.7, ±23.5)", () => {
  const holes = render(<Pico2 name="U1" />).filter((e) => e.type === "pcb_hole")
  expect(holes.length).toBe(4)
  for (const h of holes as any[]) {
    expect(h.hole_diameter).toBeCloseTo(2.1, 3)
    expect(Math.abs(h.x)).toBeCloseTo(5.7, 2)
    expect(Math.abs(h.y)).toBeCloseTo(23.5, 2)
  }
})
