# Brain board fabrication files

`clock-brain-rev1.0-gerbers.zip` is what you upload to the fab. It was
generated from `back/brain.circuit.tsx` in the same commit as this file:

```bash
tsci export back/brain.circuit.tsx -f gerbers -o "$PWD/back/fab/clock-brain-rev1.0-gerbers.zip"
```

| | |
| --- | --- |
| Board | 100 × 96 mm, 2 layers, 1.6 mm FR4, four M3 holes 4 mm in from the corners |
| Traces | 0.3 mm on both layers (also the minimum) |
| Vias | 158, 0.3 mm drill / 0.6 mm pad |
| Plated holes | 187: 0.635 mm (26, ceramic caps), 0.8 mm (42, resistors and BAT43), 0.9 mm (2, C1), 1.0 mm (91, module sockets and test points), 1.2 mm (26, wire pads and 1N5817) |
| Non-plated holes | 14: 2.1 mm (4, optional Pico screws), 3.0 mm (6, zip ties), 3.2 mm (4, M3) |
| Parts | all through-hole, hand-soldered (ignore the paste layers and the pick-and-place file) |
| DRC | KiCad: no unconnected items, no shorts. 7 via pairs sit 0.187–0.226 mm apart, under KiCad's 0.25 mm default but above PCBWay's 0.127 mm (5 mil) standard spacing. KiCad also flags the "5V_SW" text near the edge; that's a font-size artifact, the Gerber text ends 1.4 mm inside the edge |

## Tallest point (for sizing the housing)

Every module sits in 2.54 mm female headers (8.5 mm tall) on the top side,
and the module's own male headers add their ~2.5 mm plastic spacer on top of
that. The Pico 2 is the tallest: 8.5 + 2.5 + 1 mm board + ~3 mm USB connector
≈ **15 mm above the brain board**. The TB6612s and the RTC (with its coin
cell holder) come to about 14 mm. Add your standoff height under the board,
plus ~2 mm for the solder joints and wire ends on the bottom.

## Bill of materials

| Ref | Part | Notes |
| --- | --- | --- |
| U1 | Raspberry Pi Pico 2, with soldered male headers | in 2 × 20-pin female headers |
| U2, U3 | Adafruit #2448 TB6612 breakout | each in a 1 × 10 and a 1 × 6 female header (rows 15.24 mm apart); U2 = BKA30D motor A, U3 = motor B |
| U4 | Adafruit #4654 MiniBoost 5 V | in a 1 × 4 female header |
| U5 | Adafruit #5188 DS3231 RTC (STEMMA QT) | in a 1 × 8 female header; **cut its power-LED jumper**; CR1220 cell |
| D1 | 1N5817 Schottky, DO-41 | charger LOAD → Pico VSYS; band (cathode) at the "K" mark |
| D2–D5 | BAT43 Schottky, DO-35 | button wake OR; band (cathode) at the "K" mark |
| R1 | 4.7 kΩ | boost EN pull-down |
| R2 | 10 kΩ | RTC SQW pull-up |
| R3, R4 | 100 kΩ | charger CHG, PGOOD pull-ups |
| R5, R6 | 1 MΩ | battery divider |
| R7, R8 | 47 kΩ | sensor pull-ups (to GP13) |
| R9–R12 | 10 kΩ | button pull-ups |
| R13–R16 | 1 kΩ | button series |
| R17 | 100 kΩ | BTN_WAKE pull-up |
| C1 | 100 µF ≥ 10 V electrolytic, 2.5 mm lead pitch, ≤ 6.3 mm diameter | 5V_SW bulk; mind the polarity mark |
| C2–C5, C8 | 100 nF ceramic, 2.54 mm pitch | C2/C3 on the drivers' logic supply (GP7) |
| C6, C7 | 10 µF ceramic, 2.54 mm pitch, ≥ 10 V | |
| C9, C10 | 100 nF ceramic | **optional**: fit only if the sensor readings are noisy |
| C11–C14 | 1 µF X7R ceramic, 2.54 mm pitch | button debounce |
| TP1–TP7 | test points (wire loops or bare pads) | TP1 VBAT, TP2 LOAD, TP3 VSYS, TP4 5V_SW, TP5 3V3, TP6 GND, TP7 SNS_PWR (GP13) |
| J1 | 14 × 22 AWG stranded wires to the front board | same pad order as the front board |
| J2 | 5 × 22 AWG wires to the bq24074 (#4755): LOAD → OUT, GND → GND, VBAT → LIPO, CHG → CHG, PGOOD → PGOOD | |
| J3 | 5 × 22 AWG wires to the buttons: H+, H−, M+, M−, GND | each button shorts its line to GND |
| — | 4 × M3 standoffs and screws; zip ties | |

Resistors are 1/4 W axial at 10.16 mm (0.4 in) pitch.

## Before ordering (you)

The socket positions come from Adafruit's own board files and the standard
Pico layout, but check them against your actual boards:

1. Print `dist/back/brain/pcb.png` (`tsci build back/brain.circuit.tsx --pcb-png`) at 1:1 and lay each module on its outline.
2. With calipers: TB6612 has a 10-pin row and a 6-pin row 15.24 mm apart (not a 2 × 8); MiniBoost 4 pins and RTC 8 pins in one 2.54 mm row; Pico rows 17.78 mm apart.

## First power-up (you)

1. Nothing socketed. Feed J2 LOAD/GND from a bench supply at 3.7 V (current limit ~100 mA). Check VSYS (TP3) ≈ 3.5–3.6 V (D1 drops very little with no load) and 5V_SW (TP4) = 0 V.
2. Socket only the MiniBoost. With EN low (nothing driving it), 5V_SW must stay at **~0 V**. This is the "true output disconnect" the design relies on to keep the motors off during boot and sleep. If it reads anything near 3.7 V, stop.
3. Jumper the MiniBoost EN pin to LOAD (TP2) briefly: 5V_SW ≈ 5.2 V. (3V3 is dead until the Pico is in.)
4. Only then socket the TB6612s, RTC and Pico.
5. Plug the USB charger into the 4755 and check that GP10 (CHG) and GP11 (PGOOD) read low and go high when it's unplugged. The 4755's own status LEDs sit on those lines, so confirm they still give clean logic levels against the 100 kΩ pull-ups.
6. Find which motor (A on U2, B on U3) turns the minute hand. The BKA30D datasheet doesn't say; firmware just swaps the two.

## Firmware notes

- Pin map: `back/pinmap.ts`.
- GP7 (DRV_PWR) **is** the TB6612s' logic supply: it feeds VCC, PWMA, PWMB and STBY on both. Set it to 12 mA drive. To move: GP7 high, then boost EN (GP8) high, then step. To sleep: all IN pins (GP14–GP21) low, EN low, then GP7 low. With GP7 low the drivers draw nothing; a powered TB6612 draws ~1 mA even in standby. GP7 charges the breakouts' onboard 10 µF caps when it rises, so give it ~5 ms before stepping.
- Drive SNS_PWR (GP13) high only while homing. With it low, sunlight on the phototransistors draws nothing. Reading with the LEDs off gives you the ambient level to subtract.
- Disable the digital input buffer on GP28 before reading the 1 MΩ battery divider (RP2350 erratum E9). VBAT = 2 × reading.
- RP2350 GPIOs come out of reset with their internal pull-downs on. Turn them off on GP2, GP3–GP6, GP10, GP11 and GP12. Each has an external pull-up, and the ~50 kΩ pull-down would fight it: GP10–GP12 would sit near 1.1 V and leak ~20 µA each.
- LED_M (GP9) and LED_H (GP22): set 12 mA drive.
- Active-low inputs: CHG (GP10), PGOOD (GP11), RTC SQW (GP2), BTN_WAKE (GP12), and the buttons GP3–GP6.
- Wake from dormant on GP2 (RTC alarm) or GP12 (any button).

## Orders

| Rev | Date | Fab | Notes |
| --- | --- | --- | --- |
| 1.0 | — | — | not ordered yet |
