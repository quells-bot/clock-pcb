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

test("no SMD pads", () => {
  expect(cj.filter((e) => e.type === "pcb_smtpad").length).toBe(0)
})
