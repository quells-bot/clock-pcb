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
