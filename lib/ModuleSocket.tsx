import { Fragment } from "react"
import type { ChipProps } from "tscircuit"

/**
 * Shared builder for a plug-in module's socket: one female-header hole per
 * module pin, the module's outline on silkscreen, a filled dot beside pin 1,
 * and the module's name.
 *
 * Positions are mm relative to the MODULE OUTLINE CENTRE, module face up, as
 * seen from the top of the carrier board (no mirroring: the module plugs
 * into sockets on the top side).
 */

export type Pt = { x: number; y: number }

// Female header sockets: 0.64 mm square pins, so a 1.0 mm drill
const SOCKET_DRILL = 1.0
const SOCKET_PAD = 1.7

export type ModuleSpec<L extends string> = {
  /** Header pins in pin-number order: pin1 first. */
  pins: ReadonlyArray<{ label: L; x: number; y: number }>
  width: number
  height: number
  /** Silkscreen name drawn inside the outline */
  title: string
  /** Where to put the title (default: the outline centre) */
  titleAt?: Pt
  /** Pins to name on silkscreen (just inboard of the pin), for parts that fit either way round */
  named?: readonly L[]
  extras?: React.ReactNode
}

export const pinPositions = <L extends string>(spec: ModuleSpec<L>) =>
  Object.fromEntries(spec.pins.map((p) => [p.label, { x: p.x, y: p.y }])) as Record<L, Pt>

export const pinLabelsOf = <L extends string>(spec: ModuleSpec<L>) =>
  Object.fromEntries(spec.pins.map((p, i) => [`pin${i + 1}`, p.label])) as Record<string, L>

export const ModuleSocket = <L extends string>({
  spec,
  manufacturerPartNumber,
  ...props
}: ChipProps & { spec: ModuleSpec<L>; manufacturerPartNumber: string }) => {
  const { pins, width: w, height: h } = spec
  const p1 = pins[0]
  // pin-1 dot sits just outside the outline, on the side nearest pin 1
  const dotX = Math.abs(p1.x) / (w / 2) >= Math.abs(p1.y) / (h / 2) ? Math.sign(p1.x) * (w / 2 + 0.9) : p1.x
  const dotY = Math.abs(p1.x) / (w / 2) >= Math.abs(p1.y) / (h / 2) ? p1.y : Math.sign(p1.y) * (h / 2 + 0.9)
  return (
    <chip
      manufacturerPartNumber={manufacturerPartNumber}
      pinLabels={pinLabelsOf(spec)}
      footprint={
        <footprint>
          {pins.map((p, i) => (
            <Fragment key={p.label}>
              <platedhole
              portHints={[`pin${i + 1}`]}
              pcbX={p.x}
              pcbY={p.y}
              shape="circle"
              holeDiameter={SOCKET_DRILL}
              outerDiameter={SOCKET_PAD}
              />
            </Fragment>
          ))}
          <silkscreenpath
            route={[
              { x: -w / 2, y: -h / 2 },
              { x: w / 2, y: -h / 2 },
              { x: w / 2, y: h / 2 },
              { x: -w / 2, y: h / 2 },
              { x: -w / 2, y: -h / 2 },
            ]}
          />
          <silkscreencircle pcbX={dotX} pcbY={dotY} radius={0.4} />
          <silkscreentext
            text={spec.title}
            pcbX={spec.titleAt?.x ?? 0}
            pcbY={spec.titleAt?.y ?? 0}
            fontSize={1.2}
          />
          {(spec.named ?? []).map((label) => {
            const p = pins.find((q) => q.label === label)!
            // 1.9 mm from the pin, towards the middle of the module
            return (
              <Fragment key={`name-${label}`}>
                <silkscreentext text={label} pcbX={p.x} pcbY={p.y + 1.9 * Math.sign(-p.y || 1)} fontSize={1} />
              </Fragment>
            )
          })}
          {spec.extras}
        </footprint>
      }
      {...props}
    />
  )
}

/** Pins along a straight line, pitch 2.54 mm, starting at (x0, y0). */
export const pinRow = <L extends string>(labels: readonly L[], x0: number, y0: number, dx: number, dy: number) =>
  labels.map((label, i) => ({ label, x: x0 + dx * i, y: y0 + dy * i }))
