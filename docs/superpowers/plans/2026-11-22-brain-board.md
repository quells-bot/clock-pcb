# Brain Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Also load the project's `tscircuit` skill (`.claude/skills/tscircuit/`) before writing any circuit code.

**Goal:** A fab-ready, through-hole tscircuit brain board in `back/` that sockets a Pico 2, two Adafruit #2448 TB6612s, a #4654 MiniBoost and a #5188 DS3231, with solder-wire pads for the front board, charger and buttons.

**Architecture:** One footprint component per Adafruit/Pi module in `lib/` (socket holes at the module's real header positions, plus a body outline), a reusable wire-pad row in `lib/`, a single pin map in `back/pinmap.ts` that both the board and the tests read, and `back/brain.circuit.tsx` wiring it all together. Correctness is pinned by `bun test` netlist tests that render the board and query connectivity, then by `tsci` checks and the build.

**Tech Stack:** tscircuit `^0.0.3285` (React/TSX), `bun test`, `circuit-json-to-connectivity-map`, `tsci` CLI.

**Spec:** `docs/superpowers/specs/2026-11-22-brain-board-design.md` (read it first; this plan argues from it).

## Global Constraints

- Through-hole only. No `smtpad`, no SMD footprints anywhere on the board.
- 3.3 V logic. TB6612 Vcc = 3V3. 5V_SW must never connect to Pico VSYS (pin 39) or VBUS (pin 40).
- Board ≤ 100 × 100 mm, 2 layers, rectangular, four M3 mounting holes (3.2 mm drill).
- No external pull-down on STBY. Boost EN has 4.7 kΩ to GND.
- Power nets LOAD, VSYS, 5V_SW, GND, 3V3: `nominalTraceWidth` 0.8 mm. Signals: board `defaultTraceWidth` 0.3 mm (as the front board).
- Wire pads: 1.2 mm drill, 2.0 mm pad, 2.54 mm pitch (open to 3.0 mm only if DRC complains). A pair of 3.0 mm zip-tie holes beside each group.
- Socket holes for module headers: 1.0 mm drill, 1.7 mm pad.
- Axial resistors: `axial_p0.4in_id0.8mm_od1.6mm` (matches the front board). 1N5817: axial, 0.4 in pitch, 1.2 mm drill, 2.0 mm pad. BAT43: `axial_p0.3in`. Ceramic caps: `radial_p2.54mm`. 100 µF electrolytic: `radial_p2.5mm` with 0.9 mm drill (check against the chosen part's lead pitch).
- Silkscreen font 1.0 mm minimum (front board convention). Board ID text: `CLOCK BRAIN` / `Rev 1.0`.
- Never commit `docs/stepper-wiring.mmd` or `docs/clock_BOM_battery_RTC.xlsx` (user's request). Stage files by path, never `git add docs` or `git add -A`.
- Follow the front board's file conventions: part components in `lib/` export a `*_PIN_POSITIONS` table and a component taking `ChipProps`.

## Module header geometry

Taken from Adafruit's Eagle `.brd` files (GitHub `adafruit/Adafruit-TB6612-Motor-Driver-Breakout-PCB`, `Adafruit-TPS61023-PCB`, `Adafruit-DS3231-Precision-RTC-Breakout-PCB` → `Adafruit DS3231 STEMMA QT.brd`, `Adafruit-BQ24074-PCB`). All positions are mm, **relative to the module's outline centre, module face up, as seen from the top of the brain board**. Onboard parts confirmed from the same files: TB6612 STBY has a 10 kΩ pull-up to VCC; MiniBoost EN has a 100 kΩ pull-up to VIN; DS3231 SQW has no pull-up, SCL/SDA have 10 kΩ to VIN.

**#2448 TB6612** — outline 19.05 × 26.67. Two rows 15.24 apart (not a symmetric 2×8).
- Left row x = −6.985, top to bottom y = 11.43, 8.89, 6.35, 3.81, 1.27, −1.27, −3.81, −6.35, −8.89, −11.43: `VM, VCC, GND, PWMB, BIN2, BIN1, STBY, AIN1, AIN2, PWMA`.
- Right row x = +8.255, y = −6.35, −3.81, −1.27, 1.27, 3.81, 6.35: `MOTORA1, MOTORA2, GND, GND, MOTORB2, MOTORB1`.
- Its terminal block and 2.5 mm mounting holes are not used.

**#4654 MiniBoost** — outline 11.43 × 17.78. One 4-pin row at y = −6.35; x = 3.81, 1.27, −1.27, −3.81: `EN, VOUT, GND, VIN`.

**#5188 DS3231 STEMMA QT** — outline 25.40 × 17.78. One 8-pin row at y = −6.35; x = −8.89 … 8.89 step 2.54: `VIN, GND, SCL, SDA, BAT, 32K, SQW, RST`.

**Pico 2** — outline 21 × 51, USB end at +Y. Pins 1–20 at x = −8.89, y = 24.13 − 2.54·(n−1); pins 21–40 at x = +8.89, y = −24.13 + 2.54·(n−21). Mounting holes Ø2.1 at (±5.7, ±23.5). Pin names (standard Pico pinout): 1 GP0, 2 GP1, 3 GND, 4 GP2, 5 GP3, 6 GP4, 7 GP5, 8 GND, 9 GP6, 10 GP7, 11 GP8, 12 GP9, 13 GND, 14 GP10, 15 GP11, 16 GP12, 17 GP13, 18 GND, 19 GP14, 20 GP15, 21 GP16, 22 GP17, 23 GND, 24 GP18, 25 GP19, 26 GP20, 27 GP21, 28 GND, 29 GP22, 30 RUN, 31 GP26, 32 GP27, 33 AGND, 34 GP28, 35 ADC_VREF, 36 3V3, 37 3V3_EN, 38 GND, 39 VSYS, 40 VBUS. Repeated GNDs are labelled `GND1`…`GND8` (pins 3, 8, 13, 18, 23, 28, 38, 33 as `AGND`).

The Pico figures come from the standard Pico form factor, not a file read this session. Task 7 has the user check every module against calipers before ordering.

## Reference designators

| Ref | Part | Ref | Part |
| --- | --- | --- | --- |
| U1 | Pico 2 | R1 | 4.7 kΩ boost EN → GND |
| U2 | TB6612 #2448, BKA30D motor A | R2 | 10 kΩ SQW → 3V3 |
| U3 | TB6612 #2448, BKA30D motor B | R3, R4 | 100 kΩ CHG, PGOOD → 3V3 |
| U4 | MiniBoost #4654 | R5, R6 | 1 MΩ VBAT divider top, bottom |
| U5 | DS3231 #5188 | R7, R8 | 47 kΩ SNS_M, SNS_H → 3V3 |
| J1 | 14 front-board wire pads | R9–R12 | 10 kΩ button pull-ups (H+, H−, M+, M−) |
| J2 | 5 charger wire pads | R13–R16 | 1 kΩ button series |
| J3 | 5 button wire pads | R17 | 100 kΩ BTN_WAKE → 3V3 |
| D1 | 1N5817, LOAD → VSYS | C1 | 100 µF ≥ 10 V, 5V_SW |
| D2–D5 | BAT43, BTN_WAKE → each J3 button pad | C2, C3 | 100 nF U2/U3 VCC |
| TP1–TP7 | VBAT, LOAD, VSYS, 5V_SW, 3V3, GND, GP13 | C4, C5 | 100 nF U2/U3 VM |
| H1–H4 | M3 mounting holes | C6, C7 | 10 µF U2/U3 VM |
| | | C8 | 100 nF VBAT ADC node |
| | | C9, C10 | 100 nF SNS_M, SNS_H (optional fit) |
| | | C11–C14 | 1 µF button nodes |

## Review Focus

1. **Module plugged in rotated or mirrored.** Each socket's pin 1 / USB end must be unmistakable on silkscreen, and the footprint must match the module seen from above. Pinned by the footprint position tests in Task 2 and the silkscreen check in Task 6.
2. **5 V reaching the 3.3 V side.** 5V_SW must not touch VSYS, VBUS, 3V3, LOAD, or any GPIO. Pinned by the isolation test in Task 4.
3. **Motors powered at boot.** STBY must have no resistor to GND, and EN must have R1 to GND and nothing to 3V3. Pinned in Task 4.
4. **Wire-pad order mismatched to the front board.** J1 must use exactly the front board's `PAD_ORDER`. Pinned in Task 4 by importing the order from one shared source instead of retyping it.
5. **Standby leakage paths.** No resistor from any always-on rail to GND other than R1 and R6. Pinned by the "pull-down inventory" test in Task 4.

---

### Task 1: Test harness and pin map

**Files:**
- Modify: `package.json` (add devDependency `circuit-json-to-connectivity-map`, script `"test": "bun test"`)
- Create: `tests/helpers/netlist.ts`
- Create: `back/pinmap.ts`
- Modify: `front/front.circuit.tsx` (export `PAD_ORDER`; no other change)
- Test: `tests/pinmap.test.ts`

**Interfaces:**
- Produces `tests/helpers/netlist.ts`:
  - `renderCircuit(el: React.ReactElement): AnyCircuitElement[]` (uses `new Circuit()` from `tscircuit`, `.add`, `.render()`, `.getCircuitJson()`).
  - `portId(cj, ref: string): string`. `ref` is `"U1.GP0"` (component name + pin label). Throws with a readable message if the ref is missing.
  - `isConnected(cj, a: string, b: string): boolean`, via `getSourcePortConnectivityMapFromCircuitJson(cj).areIdsConnected`.
  - `netMembers(cj, ref: string): string[]`, every `"Comp.label"` on the same net as `ref`.
- Produces `back/pinmap.ts`: `export const GPIO = { SDA: 0, SCL: 1, RTC_SQW: 2, BTN_HP: 3, BTN_HM: 4, BTN_MP: 5, BTN_MM: 6, STBY: 7, BOOST_EN: 8, LED_M: 9, CHG: 10, PGOOD: 11, BTN_WAKE: 12, SPARE: 13, A_AIN1: 14, A_AIN2: 15, A_BIN1: 16, A_BIN2: 17, B_AIN1: 18, B_AIN2: 19, B_BIN1: 20, B_BIN2: 21, LED_H: 22, SNS_H: 26, SNS_M: 27, VBAT: 28 } as const` and `export const gp = (n: number) => \`GP${n}\``.
- Produces `export const PAD_ORDER` from `front/front.circuit.tsx`.

- [ ] **Step 1:** `bun add -d circuit-json-to-connectivity-map` and add the `test` script. Expected: `bun.lock` updated.
- [ ] **Step 2: Write the failing test** `tests/pinmap.test.ts`:
  - `no GPIO is used twice`: `new Set(Object.values(GPIO)).size === Object.values(GPIO).length`.
  - `IN1/IN2 pairs share a PWM slice`: for each of `[A_AIN1,A_AIN2]`, `[A_BIN1,A_BIN2]`, `[B_AIN1,B_AIN2]`, `[B_BIN1,B_BIN2]`: first is even, second === first + 1.
  - `analog signals are on ADC pins`: `SNS_H`, `SNS_M`, `VBAT` ∈ {26, 27, 28}.
  - `front board pad order is the Rev 1.0 order`: `PAD_ORDER` equals `["B3","B4","A2","A1","LED_M","SNS_M","GND1","A3","A4","B1","B2","SNS_H","LED_H","GND2"]`.
  - `harness sees front-board GND pads joined`: `isConnected(renderCircuit(<Front/>), "J1.GND1", "J1.GND2") === true`.
- [ ] **Step 3:** `bun test tests/pinmap.test.ts`. Expected: FAIL (modules not found).
- [ ] **Step 4:** Implement the helpers, `pinmap.ts` and the `PAD_ORDER` export.
- [ ] **Step 5:** `bun test tests/pinmap.test.ts`. Expected: 5 pass. Also `bunx tsc --noEmit`, clean.
- [ ] **Step 6:** Commit: `git add package.json bun.lock tests back/pinmap.ts front/front.circuit.tsx && git commit -m "Brain board: test harness and pin map"`.

### Task 2: Module socket footprints

**Files:**
- Create: `lib/Pico2.tsx`, `lib/TB6612Breakout.tsx`, `lib/MiniBoost.tsx`, `lib/DS3231Breakout.tsx`
- Test: `tests/modules.test.tsx`

**Interfaces:**
- Each file exports `<NAME>_PIN_POSITIONS: Record<label, {x, y}>` (the values in "Module header geometry" above) and a component `(props: ChipProps) => <chip …/>` with `pinLabels` using those labels, a hand-drawn `<footprint>` (one `platedhole` per pin, 1.0/1.7 mm), a silkscreen body outline at the module's outline size broken around the holes, and a pin-1 marker (Pico: a "USB" label and arrow at the +Y end).
- Names: `Pico2` / `PICO2_PIN_POSITIONS`, `TB6612Breakout` / `TB6612_PIN_POSITIONS`, `MiniBoost` / `MINIBOOST_PIN_POSITIONS`, `DS3231Breakout` / `DS3231_PIN_POSITIONS`.
- TB6612 has two pins called GND on its right row: label them `GND2`, `GND3` (left row `GND1`). Pico GND labels as in the geometry section.
- Pico mounting holes: plain `<hole diameter={2.1}>` at (±5.7, ±23.5), inside the footprint. They're for optional M2 screws through the module, not required.

- [ ] **Step 1: Write the failing test** `tests/modules.test.tsx`. For each module, render it alone on a board at (0, 0), rotation 0, and assert:
  - pad count: Pico 40, TB6612 16, MiniBoost 4, DS3231 8.
  - every `pcb_plated_hole` matches its label's entry in the geometry tables within 0.01 mm. Spot-check these explicitly: Pico `GP0` (−8.89, 24.13), `VBUS` (8.89, 24.13), `VSYS` (8.89, 21.59); TB6612 `VM` (−6.985, 11.43), `PWMA` (−6.985, −11.43), `MOTORA1` (8.255, −6.35); MiniBoost `EN` (3.81, −6.35), `VIN` (−3.81, −6.35); DS3231 `VIN` (−8.89, −6.35), `SQW` (6.35, −6.35).
  - no `pcb_smtpad` elements.
- [ ] **Step 2:** `bun test tests/modules.test.tsx`. Expected: FAIL (imports missing).
- [ ] **Step 3:** Implement the four components, following `lib/TCRT5000.tsx`'s style.
- [ ] **Step 4:** `bun test tests/modules.test.tsx`. Expected: all pass.
- [ ] **Step 5:** Commit: `git add lib tests/modules.test.tsx && git commit -m "Brain board: socket footprints for Pico 2, TB6612, MiniBoost, DS3231"`.

### Task 3: Wire-pad row

**Files:**
- Create: `lib/WirePads.tsx`
- Test: `tests/wirepads.test.tsx`

**Interfaces:**
- `WirePads(props: { name: string; pads: readonly string[]; pcbX: number; pcbY: number; pcbRotation?: number; pitch?: number /* default 2.54 */ })` renders a `<connector>` whose `pinLabels` are `pin{i+1}: pads[i]`. It has one 1.2/2.0 mm `platedhole` per pad, centred on (pcbX, pcbY) along local X; silkscreen labels alternating above and below as on the front board; and two 3.0 mm `<hole>`s for a zip tie, 4 mm inboard (local −Y) of the row, spaced at the row width + 4 mm. `insertionDirection="from_below"`.
- Pads are addressed as `J1.LED_M` etc. by label.

- [ ] **Step 1: Write the failing test**: render `<WirePads name="J9" pads={["A","B","C"]} pcbX={0} pcbY={0}/>` and assert: 3 plated holes, `hole_diameter` 1.2, `outer_diameter` 2.0, x = −2.54, 0, 2.54; exactly 2 non-plated holes of diameter 3.0, both at y = −4; a `silkscreen_text` per pad label.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: pass.
- [ ] **Step 5:** Commit: `git commit -m "Brain board: reusable wire-pad row with zip-tie holes"`.

### Task 4: Brain board netlist

**Files:**
- Create: `back/brain.circuit.tsx` (parts and connections; placement can be rough in this task)
- Test: `tests/brain.netlist.test.tsx`

**Interfaces:**
- Consumes all of Tasks 1–3. Uses `GPIO`/`gp()` for every Pico pin reference and `PAD_ORDER` for J1. J2 pads `["LOAD","GND","VBAT","CHG","PGOOD"]`. J3 pads `["H+","H-","M+","M-","GND"]`, labelled `HP, HM, MP, MM, GND` in code, with silkscreen showing `H+ H− M+ M− GND`.
- Nets named `net.LOAD`, `net.VSYS`, `net.V5_SW`, `net.V3_3`, `net.GND`, `net.VBAT`, `net.BTN_WAKE`. Declare `<net>`s for LOAD, VSYS, V5_SW, V3_3 with `isPowerNet nominalTraceWidth={0.8}`, and GND with `isGroundNet nominalTraceWidth={0.8}`.
- Before wiring motors: read `components/bka30d.pdf` to find which motor (A near the shaft, B at the far end, per `lib/BKA30D.tsx`) drives which shaft. Record it as `export const MOTOR_SHAFT = { A: "MIN" | "HOUR", B: … }` in `back/pinmap.ts`, for Task 6's silkscreen. If the datasheet doesn't say, set `A: "MIN"` and add a TODO line to the fab README to confirm on the bench.

- [ ] **Step 1: Write the failing test** `tests/brain.netlist.test.tsx`. Render `<Brain/>` once in `beforeAll`. Assert, as a table-driven `test.each` of `[a, b]` pairs that must be connected:
  - **Power:** `J2.LOAD`–`U4.VIN`, `J2.LOAD`–`D1.anode`, `D1.cathode`–`U1.VSYS`, `U4.VOUT`–`U2.VM`, `U4.VOUT`–`U3.VM`, `U4.VOUT`–`C1.pin1`, `U1.3V3`–`U2.VCC`, `U1.3V3`–`U3.VCC`, `U1.3V3`–`U5.VIN`, `U2.PWMA`/`U2.PWMB`/`U3.PWMA`/`U3.PWMB`–`U1.3V3`, every `GND*` pin of U1–U5 plus `J1.GND1`, `J1.GND2`, `J2.GND`, `J3.GND`–`U1.GND1`.
  - **RTC:** `U1.GP0`–`U5.SDA`, `U1.GP1`–`U5.SCL`, `U1.GP2`–`U5.SQW`, `U5.SQW`–`R2` (other end on 3V3).
  - **Drivers:** `U1.GP7`–`U2.STBY`, `U1.GP7`–`U3.STBY`, `U1.GP8`–`U4.EN`, `U4.EN`–`R1` (other end GND), GP14–17 → `U2.AIN1, AIN2, BIN1, BIN2`, GP18–21 → `U3.AIN1, AIN2, BIN1, BIN2`.
  - **Motor wires:** `J1.A1`–`U2.MOTORA1`, `J1.A2`–`U2.MOTORA2`, `J1.A3`–`U2.MOTORB1`, `J1.A4`–`U2.MOTORB2`, `J1.B1`–`U3.MOTORA1`, `J1.B2`–`U3.MOTORA2`, `J1.B3`–`U3.MOTORB1`, `J1.B4`–`U3.MOTORB2`.
  - **Sensors:** `J1.LED_M`–`U1.GP9`, `J1.LED_H`–`U1.GP22`, `J1.SNS_M`–`U1.GP27`, `J1.SNS_H`–`U1.GP26`, each SNS also to its 47 kΩ (R7, R8) whose other end is 3V3.
  - **Decoupling:** C2/C3 across U2/U3 `VCC`–GND, C4/C6 across `U2.VM`–GND, C5/C7 across `U3.VM`–GND, C9/C10 from SNS_M/SNS_H to GND, C1 `pin2` on GND.
  - **Charger:** `J2.CHG`–`U1.GP10` and R3, `J2.PGOOD`–`U1.GP11` and R4, `J2.VBAT`–`R5`, R5/R6 junction–`U1.GP28` and C8.
  - **Buttons:** for each of (HP, R13, R9, C11, D2, GP3), (HM, R14, R10, C12, D3, GP4), (MP, R15, R11, C13, D4, GP5), (MM, R16, R12, C14, D5, GP6): the J3 pad to series R pin1 and to D cathode; series R pin2 to GPIO, pull-up and cap; each D anode to `U1.GP12` and R17.
  - **Isolation (must NOT be connected), each its own test:** `U4.VOUT` vs `U1.VSYS`, `U1.VBUS`, `U1.3V3`, `J2.LOAD`, and every Pico `GP*` pin. `J2.LOAD` vs `U1.3V3`. `U1.VBUS` has no other members (`netMembers` length 1).
  - **Pull-down inventory:** of all resistors, the only ones with a pin on `net.GND` are R1 and R6; in particular no resistor sits on the STBY net (`netMembers(cj, "U1.GP7")` contains no `R*`).
- [ ] **Step 2:** `bun test tests/brain.netlist.test.tsx`. Expected: FAIL (no board).
- [ ] **Step 3:** Implement `back/brain.circuit.tsx`. Use `<board width={…} height={…} layers={2} defaultTraceWidth="0.3mm">` with a provisional 100 × 100 size. Values and footprints from Global Constraints and the ref table. `<testpoint>` for TP1–TP7 (through-hole loop: `holeDiameter="1.0mm"`, `padDiameter="2.0mm"`).
- [ ] **Step 4:** `bun test tests/brain.netlist.test.tsx`. Expected: all pass. Then `tsci check netlist back/brain.circuit.tsx` and `tsci check pin_specification back/brain.circuit.tsx`: no errors, and any warnings are understood and listed in the commit message.
- [ ] **Step 5:** Commit: `git commit -m "Brain board: full netlist with connectivity tests"`.

### Task 5: Placement, outline and routing

**Files:**
- Modify: `back/brain.circuit.tsx`
- Test: `tests/brain.pcb.test.tsx`

**Placement guidance (builder decides exact numbers):** Pico on the left with its USB end at a board edge. U2/U3 side by side with their motor rows facing J1. J1 (14 pads) along the edge nearest U2/U3. J2 near U4 and D1, so LOAD → U4 → C1 → U2/U3 is a short run. J3 and the button RCs together on one edge. U5 away from the motor wiring. Keep a 2 mm gap around each module outline so female headers and fingers fit. C2–C7 within 5 mm of their driver's VCC/VM socket pins, C1 between U4 and the drivers. Test points along one edge. M3 holes 4 mm in from each corner.

- [ ] **Step 1: Write the failing test** `tests/brain.pcb.test.tsx`:
  - `board fits 100 × 100`: the `pcb_board` width and height are each ≤ 100.
  - `four M3 holes`: exactly 4 `pcb_hole` of diameter 3.2 that aren't part of a module footprint (filter by `pcb_component_id` absent).
  - `power traces are wide`: every routed `pcb_trace` segment on LOAD, VSYS, V5_SW, V3_3 or GND has `width ≥ 0.8`, except necking within 1.5 mm of a pad.
  - `fully routed`: no `pcb_autorouting_error` and no `pcb_trace_error` elements.
  - `no SMD`: zero `pcb_smtpad`.
- [ ] **Step 2:** Run. Expected: FAIL (fully routed and widths, until placement exists).
- [ ] **Step 3:** Set the final board size (as small as the placement allows, ≤ 100 × 100), place every part, add H1–H4, and let tscircuit's autorouter route. Following the tscircuit skill: `tsci check placement back/brain.circuit.tsx`, then `tsci check routing-difficulty`, then `tsci build back/brain.circuit.tsx --pcb-png`. If routing fails, move parts (don't hand-write a router). Add a bottom-layer GND `<copperpour>` only if the autorouter leaves GND fragmented.
- [ ] **Step 4:** Run `bun test` (all files). Expected: all pass. Then `tsci check shorts back/brain.circuit.tsx` (clean) and `tsci check pcb-style back/brain.circuit.tsx`, fixing anything it flags as a long odd-angle run.
- [ ] **Step 5:** Look at `dist/` PCB PNG and confirm that no trace passes between a module's socket pins where it would sit under the module's own through-hole joints. Commit: `git commit -m "Brain board: placement and routing"`.

### Task 6: Silkscreen and markings

**Files:**
- Modify: `back/brain.circuit.tsx`
- Test: `tests/brain.silk.test.tsx`

- [ ] **Step 1: Write the failing test**: the board's `pcb_silkscreen_text` set includes `CLOCK BRAIN`, `Rev 1.0`, `CUT RTC LED JUMPER`, `5V_SW: NEVER TO VSYS`, `USB`, and driver labels built from `MOTOR_SHAFT` (e.g. `MIN` near U2). Every J1/J2/J3 pad label is present. Every silkscreen text has `font_size ≥ 1.0`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Add the texts. Place them clear of pads; `tsci check pcb-style` and the PNG are the judge.
- [ ] **Step 4:** Run `bun test`. Expected: all pass. Rebuild, inspect the PNG for text over pads.
- [ ] **Step 5:** Commit: `git commit -m "Brain board: silkscreen labels and board ID"`.

### Task 7: Fab files, docs and the user's bench checklist

**Files:**
- Create: `back/fab/README.md`, `back/fab/clock-brain-rev1.0-gerbers.zip`
- Modify: `README.md` (brain board no longer "todo"; add the `bun test` line)
- Modify: `docs/superpowers/specs/2026-11-22-brain-board-design.md`: mark it "Status: implemented"; nothing else.

- [ ] **Step 1:** Export: `tsci export back/brain.circuit.tsx -f gerbers -o "$PWD/back/fab/clock-brain-rev1.0-gerbers.zip"`. Expected: zip exists and holds copper, mask, silk, edge and drill files (`unzip -l`).
- [ ] **Step 2:** Optional DRC as for the front board: `tsci export back/brain.circuit.tsx -f kicad_zip -o dist/brain-kicad.zip` and run KiCad DRC if KiCad is installed. Record the result.
- [ ] **Step 3:** Write `back/fab/README.md` in the same shape as `front/fab/README.md`: the export command; a board stats table (size, layers, thickness 1.6 mm unless the user says otherwise, hole counts by size, trace widths); the **tallest point** (female header height + tallest module, + standoff) for sizing the housing; the full BOM from the ref table with values and footprints, plus 2×20, 1×10, 1×6, 1×4 and 1×8 female headers and 4 M3 standoffs. Then these sections:
  - **Before ordering (user):** caliper checks against the real boards. TB6612 row spacing 15.24 mm and 10 + 6 pin rows; MiniBoost and RTC single row at 2.54 mm; Pico rows 17.78 mm. Print the PCB PNG at 1:1 and lay each module on it.
  - **First power-up (user):** with nothing socketed, feed LOAD from a bench supply at 3.7 V and check that VSYS is ~3.4 V and 5V_SW is 0 V. Socket the MiniBoost with EN unconnected: OUT should be ~0 V (the true-disconnect check the spec depends on). Drive EN high and OUT should be ~5.2 V. Only then socket the TB6612s and Pico.
  - **Firmware notes:** pin map from `back/pinmap.ts`; leave STBY high while asleep; disable the GP28 digital input buffer before reading the 1 MΩ divider (RP2350 erratum E9); 12 mA drive on LED pins; CHG/PGOOD/SQW/BTN_WAKE are active-low.
- [ ] **Step 4:** `bun test` and `bunx tsc --noEmit`. Expected: all pass, clean.
- [ ] **Step 5:** Commit: `git add back README.md docs/superpowers && git commit -m "Brain board Rev 1.0: Gerbers, fab notes, bench checklist"`.
