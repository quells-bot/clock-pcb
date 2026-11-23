# Clock PCBs

Two boards for an analog clock driven by a BKA30D-R5 dual-shaft stepper.

- **front/**: motor + hand-home sensor board ([front/front.circuit.tsx](front/front.circuit.tsx))
- **back/** (todo): brain board

Shared footprints live in [lib/](lib/). Datasheets are in [components/](components/).

## Working on the boards

```bash
bun install            # once
tsci build --pcb-png   # build + render to dist/
tsci dev               # interactive preview
tsci export front/front.circuit.tsx -f kicad_zip -o dist/front-kicad.zip
```

## Front board coordinates

Origin is the clock centre (motor output shaft), viewed from the dial side:
+Y is 12 o'clock, +X is 3 o'clock. The motor is placed on the bottom layer.
