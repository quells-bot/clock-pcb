import { beforeAll, expect, test } from "bun:test"
import { PAD_ORDER } from "../front/front.circuit"
import Brain from "../back/brain.circuit"
import { renderCircuit } from "./helpers/netlist"

let texts: any[]
beforeAll(() => {
  texts = (renderCircuit(<Brain />) as any[]).filter((e) => e.type === "pcb_silkscreen_text")
})
const has = (t: string) => texts.some((x) => x.text === t)

test.each([
  "CLOCK BRAIN",
  "Rev 1.0",
  "CUT RTC LED JUMPER",
  "5V_SW: NEVER TO VSYS",
  "USB",
  "MOTOR A",
  "MOTOR B",
])("board says %s", (t) => {
  expect(has(t)).toBe(true)
})

test("every wire pad is labelled", () => {
  for (const t of [...PAD_ORDER, "LOAD", "GND", "VBAT", "CHG", "PGOOD", "H+", "H-", "M+", "M-"]) {
    expect(has(t)).toBe(true)
  }
})

test("all silkscreen text is at least 1.0 mm", () => {
  const small = texts.filter((t) => t.font_size < 1 - 1e-6).map((t) => `${t.text} (${t.font_size})`)
  expect(small).toEqual([])
})

const cjAll = () => renderCircuit(<Brain />) as any[]
const portXY = (cj: any[], comp: string, pin: string) => {
  const c = cj.find((e) => e.type === "source_component" && e.name === comp)
  const sp = cj.find((e) => e.type === "source_port" && e.source_component_id === c.source_component_id && (e.name === pin || (e.port_hints ?? []).includes(pin)))
  const pp = cj.find((e) => e.type === "pcb_port" && e.source_port_id === sp.source_port_id)
  return { x: pp.x, y: pp.y }
}
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

// Hand-soldered: every polarized part needs its orientation on the board.
test.each(["D1", "D2", "D3", "D4", "D5"])("%s has a cathode mark beside its cathode pad", (d) => {
  const cj = cjAll()
  const k = portXY(cj, d, "cathode")
  const a = portXY(cj, d, "anode")
  const marks = cj.filter((e) => e.type === "pcb_silkscreen_text" && e.text === "K")
  expect(marks.some((m) => dist(m.anchor_position, k) < 3 && dist(m.anchor_position, a) > dist(m.anchor_position, k) + 3)).toBe(true)
})

// A 4- or 8-pin single row goes in either way round: name the end pins.
test.each([
  ["U4", "EN"], ["U4", "VIN"], ["U5", "VIN"], ["U5", "RST"],
])("%s socket names its %s pin", (u, pin) => {
  const cj = cjAll()
  const p = portXY(cj, u, pin)
  const labels = cj.filter((e) => e.type === "pcb_silkscreen_text" && e.text === pin)
  expect(labels.some((l) => dist(l.anchor_position, p) < 3.5)).toBe(true)
})
