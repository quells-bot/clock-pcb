# Front board fabrication files

`clock-front-rev1.0-gerbers.zip` is what you upload to the fab. It was
generated from `front/front.circuit.tsx` in the same commit as this file:

```bash
tsci export front/front.circuit.tsx -f gerbers -o "$PWD/dist/front-gerbers.zip"
```

| | |
| --- | --- |
| Board | 58 × 87 mm, 2 layers, 1.6 mm FR4 |
| Traces | 0.3 mm, top layer only, no vias |
| Plated holes | 34 (0.8, 0.9 and 1.0 mm) |
| Non-plated holes | 14 (1.0, 2.3, 2.5, 3.8 and 6.8 mm) |
| Parts | all through-hole, hand-soldered (no paste layers needed) |

If the board changes, regenerate this zip, bump the `Rev` silkscreen text,
and rename the file to match.

## Bill of materials

| Ref | Part | Notes |
| --- | --- | --- |
| M1 | BKA30D-R5 dual-shaft stepper | mounts on the back; 4× ST2.0 self-tapping screws |
| U1, U2 | Vishay TCRT5000 | clips may be snipped; locating peg sets orientation |
| R1, R2 | 220 Ω 1/4 W axial | 10.16 mm (0.4 in) lead pitch |
| J1 | 14 wire pads | wires enter from the back |
