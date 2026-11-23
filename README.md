# Clock PCBs

Two boards for an analog clock driven by a BKA30D-R5 dual-shaft stepper.

- **front/**: motor + hand-home sensor board ([front/front.circuit.tsx](front/front.circuit.tsx))
- **back/**: brain board, a carrier for the Pico 2, two TB6612s, MiniBoost and DS3231 ([back/brain.circuit.tsx](back/brain.circuit.tsx), fab notes in [back/fab/](back/fab/README.md))

Shared footprints live in [lib/](lib/). Datasheets are in [components/](components/).

## Working on the boards

```bash
bun install            # once
tsci build --pcb-png   # build + render to dist/
tsci dev               # interactive preview
bun test               # netlist, footprint and PCB checks for the brain board
bun run kicad          # KiCad zips for both boards, written to dist/
```

## Front board coordinates

Origin is the clock centre (motor output shaft), viewed from the dial side:
+Y is 12 o'clock, +X is 3 o'clock. The motor is placed on the bottom layer.
