import { beforeAll, expect, test } from "bun:test"
import Brain from "../back/brain.circuit"
import { renderCircuitRouted } from "./helpers/netlist"

let cj: any[]
beforeAll(async () => {
  cj = (await renderCircuitRouted(<Brain />)) as any[]
}, 600_000)

test("board fits 100 x 100 mm", () => {
  const board = cj.find((e) => e.type === "pcb_board")
  expect(board.width).toBeLessThanOrEqual(100)
  expect(board.height).toBeLessThanOrEqual(100)
})

test("four 3.2 mm M3 mounting holes", () => {
  const m3 = cj.filter((e) => e.type === "pcb_hole" && Math.abs(e.hole_diameter - 3.2) < 0.01)
  expect(m3.length).toBe(4)
})

test("fully routed", () => {
  expect(cj.filter((e) => e.type === "pcb_autorouting_error")).toEqual([])
  expect(cj.filter((e) => e.type === "pcb_trace_error")).toEqual([])
  expect(cj.filter((e) => e.type === "pcb_trace").length).toBeGreaterThan(0)
})

// tscircuit's autorouter routes every net at the board's minTraceWidth and
// ignores per-net widths, so the floor is 0.3 mm for all traces. That's ample:
// 0.3 mm of 1 oz outer copper carries ~1 A at a 10 °C rise, and the largest
// current here is ~150 mA while the motors move.
test("every trace is at least 0.3 mm wide", () => {
  const thin = cj
    .filter((e) => e.type === "pcb_trace")
    .flatMap((t) => t.route.filter((r: any) => r.route_type === "wire" && r.width < 0.3 - 1e-6))
  expect(thin).toEqual([])
})

// PCBWay standard process: 0.3 mm min drill, 0.15 mm annular ring. Use
// The router.s own default was 0.2 / 0.3 mm.
test("vias are manufacturable: 0.3 mm drill, 0.6 mm pad or larger", () => {
  const bad = cj
    .filter((e) => e.type === "pcb_via")
    .filter((v) => v.hole_diameter < 0.3 - 1e-6 || v.outer_diameter < 0.6 - 1e-6)
    .map((v) => `${v.hole_diameter}/${v.outer_diameter} at (${v.x.toFixed(1)}, ${v.y.toFixed(1)})`)
  expect(bad).toEqual([])
})

// PCBWay's standard 2-layer process allows 5 mil (0.127 mm) spacing. The
// router doesn't fully honour its via-spacing rule, so a few via pairs land
// between 0.13 and 0.25 mm; KiCad's 0.25 mm default flags them, the fab won't.
test("vias keep at least 0.127 mm copper clearance", () => {
  const vias = cj.filter((e) => e.type === "pcb_via")
  const close: string[] = []
  for (let i = 0; i < vias.length; i++)
    for (let j = i + 1; j < vias.length; j++) {
      const [a, b] = [vias[i], vias[j]]
      const gap = Math.hypot(a.x - b.x, a.y - b.y) - (a.outer_diameter + b.outer_diameter) / 2
      const sameNet = a.pcb_trace_id && a.pcb_trace_id === b.pcb_trace_id
      if (!sameNet && gap < 0.127 - 1e-6 && gap > -a.outer_diameter) close.push(`(${a.x.toFixed(1)}, ${a.y.toFixed(1)}) gap ${gap.toFixed(2)}`)
    }
  expect(close).toEqual([])
})

// 100 µF / 16 V electrolytics have ~0.6 mm leads; 0.625 mm holes won't take them
test("electrolytic C1 has 0.9 mm holes", () => {
  const c1 = cj.find((e) => e.type === "source_component" && e.name === "C1")
  const pcb = cj.find((e) => e.type === "pcb_component" && e.source_component_id === c1.source_component_id)
  const holes = cj.filter((e) => e.type === "pcb_plated_hole" && e.pcb_component_id === pcb.pcb_component_id)
  expect(holes.length).toBe(2)
  for (const h of holes) expect(h.hole_diameter).toBeCloseTo(0.9, 2)
})

test("no SMD pads", () => {
  expect(cj.filter((e) => e.type === "pcb_smtpad").length).toBe(0)
})
