import type { AnyCircuitElement } from "circuit-json"
import { getSourcePortConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import type { ReactElement } from "react"
import { Circuit } from "tscircuit"

type CJ = AnyCircuitElement[]

export const renderCircuit = (el: ReactElement): CJ => {
  const circuit = new Circuit()
  circuit.add(el)
  circuit.render()
  return circuit.getCircuitJson() as CJ
}

const byType = <T extends AnyCircuitElement["type"]>(cj: CJ, type: T) =>
  cj.filter((e) => e.type === type) as Extract<AnyCircuitElement, { type: T }>[]

/** Source port id for "Comp.label" (label = pin name or any of its port hints). */
export const portId = (cj: CJ, ref: string): string => {
  const dot = ref.indexOf(".")
  const comp = ref.slice(0, dot)
  const label = ref.slice(dot + 1)
  const component = byType(cj, "source_component").find((c) => c.name === comp)
  if (!component) throw new Error(`no component named ${comp} (from ${ref})`)
  const port = byType(cj, "source_port").find(
    (p) =>
      p.source_component_id === component.source_component_id &&
      (p.name === label || (p.port_hints ?? []).includes(label as string)),
  )
  if (!port) throw new Error(`no pin ${label} on ${comp} (from ${ref})`)
  return port.source_port_id
}

const connectivity = new WeakMap<CJ, ReturnType<typeof getSourcePortConnectivityMapFromCircuitJson>>()
const mapFor = (cj: CJ) => {
  let map = connectivity.get(cj)
  if (!map) {
    map = getSourcePortConnectivityMapFromCircuitJson(cj as any)
    connectivity.set(cj, map)
  }
  return map
}

export const isConnected = (cj: CJ, a: string, b: string): boolean =>
  mapFor(cj).areIdsConnected(portId(cj, a), portId(cj, b))

/** Every "Comp.pinName" on the same net as `ref` (including ref's own port). */
export const netMembers = (cj: CJ, ref: string): string[] => {
  const map = mapFor(cj)
  const id = portId(cj, ref)
  const comps = new Map(byType(cj, "source_component").map((c) => [c.source_component_id, c.name]))
  return byType(cj, "source_port")
    .filter((p) => p.source_port_id === id || map.areIdsConnected(id, p.source_port_id as string))
    .map((p) => `${comps.get(p.source_component_id as string) ?? "?"}.${p.name}`)
}

/** Render and wait for the autorouter to finish, as `tsci build` does. */
export const renderCircuitRouted = async (el: ReactElement): Promise<CJ> => {
  const circuit = new Circuit()
  circuit.add(el)
  await circuit.renderUntilSettled()
  return circuit.getCircuitJson() as CJ
}
