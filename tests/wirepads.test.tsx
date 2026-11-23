import { expect, test } from "bun:test"
import { WirePads } from "../lib/WirePads"
import { renderCircuit } from "./helpers/netlist"

const cj = renderCircuit(
  <board width="40mm" height="40mm">
    <WirePads name="J9" pads={["A", "B", "C"]} pcbX={0} pcbY={0} />
  </board>,
) as any[]
const plated = cj.filter((e) => e.type === "pcb_plated_hole")
const holes = cj.filter((e) => e.type === "pcb_hole")

test("one 1.2 mm drill / 2.0 mm pad per wire at 2.54 mm pitch", () => {
  expect(plated.length).toBe(3)
  for (const h of plated) {
    expect(h.hole_diameter).toBeCloseTo(1.2, 3)
    expect(h.outer_diameter).toBeCloseTo(2.0, 3)
  }
  const xs = plated.map((h) => h.x).sort((a, b) => a - b)
  expect(xs[0]).toBeCloseTo(-2.54, 2)
  expect(xs[1]).toBeCloseTo(0, 2)
  expect(xs[2]).toBeCloseTo(2.54, 2)
})

test("two 3.0 mm zip-tie holes 4 mm inboard of the row", () => {
  expect(holes.length).toBe(2)
  for (const h of holes) {
    expect(h.hole_diameter).toBeCloseTo(3.0, 3)
    expect(h.y).toBeCloseTo(-4, 2)
  }
})

test("each pad is labelled on silkscreen", () => {
  const texts = cj.filter((e) => e.type === "pcb_silkscreen_text").map((t) => t.text)
  for (const label of ["A", "B", "C"]) expect(texts).toContain(label)
})

test("pads are addressable by label", () => {
  const names = cj.filter((e) => e.type === "source_port").map((p) => p.name)
  expect(names.sort()).toEqual(["A", "B", "C"])
})
