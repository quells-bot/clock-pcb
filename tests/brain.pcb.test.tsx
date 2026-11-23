import { beforeAll, expect, test } from "bun:test"
import Brain from "../back/brain.circuit"
import { renderCircuitRouted } from "./helpers/netlist"

let cj: any[]
beforeAll(async () => {
  cj = (await renderCircuitRouted(<Brain />)) as any[]
}, 600_000)

const POWER_NETS = ["LOAD", "VSYS", "V5_SW", "V3_3", "GND"]

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

test("power traces are at least 0.8 mm away from pads", () => {
  // which source nets each pcb_trace belongs to
  const netName = new Map(cj.filter((e) => e.type === "source_net").map((n) => [n.source_net_id, n.name]))
  const traceNets = new Map<string, string[]>(
    cj.filter((e) => e.type === "source_trace").map((t) => [t.source_trace_id, (t.connected_source_net_ids ?? []).map((id: string) => netName.get(id))]),
  )
  const pads = cj.filter((e) => e.type === "pcb_plated_hole" || e.type === "pcb_port")
  const nearPad = (p: { x: number; y: number }) => pads.some((h) => Math.hypot(h.x - p.x, h.y - p.y) < 1.5)
  const thin: string[] = []
  for (const t of cj.filter((e) => e.type === "pcb_trace")) {
    const nets = traceNets.get(t.source_trace_id) ?? []
    if (!nets.some((n) => POWER_NETS.includes(n))) continue
    const pts = t.route.filter((r: any) => r.route_type === "wire")
    for (let i = 1; i < pts.length; i++) {
      if (nearPad(pts[i - 1]) || nearPad(pts[i])) continue
      if (pts[i].width < 0.8 - 1e-6) thin.push(`${nets.join("/")} width ${pts[i].width} at (${pts[i].x.toFixed(1)}, ${pts[i].y.toFixed(1)})`)
    }
  }
  expect(thin).toEqual([])
})

test("no SMD pads", () => {
  expect(cj.filter((e) => e.type === "pcb_smtpad").length).toBe(0)
})
