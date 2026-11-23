import { Fragment } from "react"

/**
 * A row of plated holes for soldering 22 AWG stranded wires, with a pad label
 * per hole and two zip-tie holes so the bundle is held to the board and the
 * solder joints don't flex.
 *
 * Local frame (before pcbRotation): pads along X centred on (pcbX, pcbY),
 * labels on +Y, zip-tie holes on -Y ("inboard": point -Y at the board).
 */

const DRILL = 1.2 // tinned 22 AWG stranded
const PAD = 2.0
const ZIP_HOLE = 3.0
const ZIP_INSET = 4

export type WirePadsProps = {
  name: string
  /** Pin labels, left to right; pads are addressed as `${name}.${label}` */
  pads: readonly string[]
  /** Silkscreen text per pad if it differs from the label (e.g. "H+") */
  silk?: readonly string[]
  pcbX: number
  pcbY: number
  pcbRotation?: number
  pitch?: number
}

export const WirePads = ({ name, pads, silk, pcbX, pcbY, pcbRotation = 0, pitch = 2.54 }: WirePadsProps) => {
  const x = (i: number) => (i - (pads.length - 1) / 2) * pitch
  const zipX = ((pads.length - 1) * pitch) / 2 + 2
  return (
    <connector
      name={name}
      pinLabels={Object.fromEntries(pads.map((label, i) => [`pin${i + 1}`, label]))}
      pcbX={pcbX}
      pcbY={pcbY}
      pcbRotation={pcbRotation}
      footprint={
        <footprint insertionDirection="from_below">
          {pads.map((label, i) => (
            <Fragment key={label}>
              <platedhole
                portHints={[`pin${i + 1}`]}
                pcbX={x(i)}
                pcbY={0}
                shape="circle"
                holeDiameter={DRILL}
                outerDiameter={PAD}
              />
              {/* alternate between two rows so neighbouring labels never touch */}
              <silkscreentext text={silk?.[i] ?? label} pcbX={x(i)} pcbY={i % 2 === 0 ? 2 : 3.5} fontSize={1} />
            </Fragment>
          ))}
          <hole pcbX={-zipX} pcbY={-ZIP_INSET} diameter={ZIP_HOLE} />
          <hole pcbX={zipX} pcbY={-ZIP_INSET} diameter={ZIP_HOLE} />
        </footprint>
      }
    />
  )
}
