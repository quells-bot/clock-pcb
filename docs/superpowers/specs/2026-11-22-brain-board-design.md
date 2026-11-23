# Brain board design

Date: 2026-11-22. Status: draft for review.

## Intent

The clock has two boards. The front board (`front/`, Rev 1.0 ordered) carries
the BKA30D-R5 dual-shaft stepper and two TCRT5000 hand-home sensors. This
document covers the second board, the **brain board**: a carrier that the
off-the-shelf modules plug into, so the prototype that works on a breadboard
(`docs/stepper-wiring.mmd`, `docs/clock_BOM_battery_RTC.xlsx`) becomes one
tidy, hand-solderable board.

The clock runs on battery for months. The Pico sleeps and wakes once a minute
on an RTC alarm, turns on the 5 V motor rail, steps the hands, then turns
everything off again. The board's job is to make that power path and that wake
signal right, and to make the modules easy to swap.

## Goals

- Sockets (female headers) for: Raspberry Pi Pico 2, two Adafruit #2448
  TB6612 breakouts (one per motor), Adafruit #4654 MiniBoost, and an Adafruit
  #5188 DS3231 RTC.
- Solder-wire pads for: the front board (14 wires), the off-board Adafruit
  #4755 bq24074 charger, and the off-board set buttons.
- RTC on I²C, with its INT/SQW alarm on a GPIO so it can wake the Pico from
  dormant.
- Battery voltage on an ADC pin and charger status (CHG, PGOOD) on GPIOs, so
  firmware can show a state-of-charge estimate and know when it's plugged in.
- Mounts on the back plate of the round 6 in (152 mm) housing.

## Non-goals

- Charging circuitry, USB-C or barrel jack, battery connectors: all on the
  off-board 4755, placed wherever suits the housing.
- The pack thermistor. It wires to the 4755 only (cut its THERM jumper,
  10 kΩ NTC from THERM to battery negative, taped to the packs). Nothing
  for it on this board.
- Buttons themselves. They live off-board; only their wire pads and
  debounce parts are here.
- Bare chips. The BOM's "PCB" column (BQ24074, TPS61023, DS3231SN,
  TB6612FNG, SS14) is superseded: this board uses the breakouts.
- Pico USB access from outside the housing.
- Firmware.

## Anti-goals

- Any SMD part. The user hand-solders everything: through-hole only.
- Anything that leaves the motors or the 5 V rail powered while the Pico is
  booting or asleep.
- Anything that wastes standby current. Average budget is about 2.6 mA
  (BOM "Battery life" tab); a stray LED or low-value divider ruins it.
- Ever connecting the 5.2 V boost output to Pico VBUS or VSYS.

## Constraints

- Through-hole only, hand-soldered.
- 3.3 V logic everywhere (Pico 2 / RP2350). TB6612 Vcc = 3.3 V, not 5 V.
- Board ≤ 100 × 100 mm (PCBWay's cheapest tier), 2 layers, rectangular,
  four M3 mounting holes. Screws to the housing back plate on standoffs.
- Height: no limit. The housing isn't designed yet and will be built around
  this board. Use standard-height female headers; note the tallest point
  (socketed module + standoff) in the fab README so the housing can be
  sized from it.
- Cable entry: not fixed by the housing yet. Builder picks which edges the wire pads go on
  for clean routing and short cable runs. Keep the Pico's USB end clear for
  a cable during development.
- Built in tscircuit like the front board, in `back/` (the README already
  names it), with module footprints in `lib/`.
- Front board's 14 wire pads are fixed (Rev 1.0 is ordered). Order, left to
  right: `B3 B4 A2 A1 LED_M SNS_M GND1 A3 A4 B1 B2 SNS_H LED_H GND2`.
  The front board already carries the 220 Ω LED resistors and ties each
  sensor's emitter and LED cathode to GND.

## Approaches considered

1. **Compact rectangle on standoffs (chosen).** ≤ 100 × 100 mm, four M3
   holes, placed anywhere on the back plate. Cheapest fab tier, short simple
   layout, free to place relative to the cables.
2. **Full round board (~150 mm).** Only worth it if the board were the back
   plate itself; costs more, mostly empty, and its holes and cutouts would
   have to match the housing exactly. Rejected.
3. **Stacked directly behind the front board.** Ruled out: the board attaches
   to the housing back.

## Decided

- Modules: Pico 2, 2 × #2448, #4654, #5188 in sockets; #4755 charger
  off-board. (User.)
- Buttons off-board. (User.)
- Battery state-of-charge signal from the charger to an ADC pin. (User.)
- Pin assignments are flexible; firmware follows the board. (User.) The map
  below is a starting point the builder may change for cleaner routing.
- Compact rectangle. (User.)

## Circuit

### Power

| Net | From | To |
| --- | --- | --- |
| LOAD | charger OUT (≤ 4.4 V) via cable | MiniBoost IN; 1N5817 anode |
| VSYS | 1N5817 cathode | Pico VSYS (pin 39) |
| 5V_SW | MiniBoost OUT (5.2 V) | both TB6612 Vmotor; 100 µF ≥ 10 V electrolytic bulk |
| 3V3 | Pico 3V3 OUT (pin 36) | TB6612 Vcc (both), RTC Vin, all pull-ups |
| VBAT | charger LIPO pin via cable | divider to ADC only (sense, no load) |
| GND | one ground for everything | |

- The 1N5817 (DO-41, through-hole) lets the Pico's own USB be plugged in for
  programming without back-feeding the charger.
- The front board's LEDs are driven from GPIOs, so nothing on the front cable
  touches 5V_SW.

### Pull resistors that set safe defaults

- **Boost EN:** 4.7 kΩ to GND (the MiniBoost has an onboard pull-up to IN;
  the diagram's option B). Boost is off unless the Pico drives EN high.
  Builder: confirm the MiniBoost's onboard EN resistor value from Adafruit's
  board files and check the divider stays well under the TPS61023's EN low
  threshold.
  This divider draws ~42 µA from LOAD at all times (if the onboard pull-up is
  100 kΩ). That's ~1.6 % of the budget; accepted. Count it in the power
  budget.
- **STBY (shared by both TB6612s): no external pull-down.** (My call, from
  the review.) Each #2448 pulls STBY up to Vcc with 10 kΩ onboard, two in
  parallel = 5 kΩ on the always-on 3V3 rail. Holding STBY low against that,
  by resistor or by GPIO, costs ~0.55–0.66 mA continuously, about +21 %
  average draw. Instead, the boost EN pull-down is the hardware safety: with
  EN low the MiniBoost's true output disconnect leaves Vmotor at 0 V, so the
  motors can't move during boot or sleep whatever STBY does. Firmware leaves
  STBY high (or the GPIO as an input) while asleep, so no current flows, and
  drives all IN pins low before sleeping. Builder: confirm the TPS61023 /
  MiniBoost really disconnects the output to ~0 V in shutdown; if it
  doesn't, stop and raise it.
- **RTC INT/SQW:** 10 kΩ to 3V3 (open drain, no onboard pull-up).
- **Charger CHG, PGOOD:** 100 kΩ each to 3V3 (open drain, active low). The
  4755's own LEDs sit on those lines; check they still read cleanly as a
  logic high/low with the LEDs in circuit.

### Battery sense

- VBAT → 1 MΩ → ADC node → 1 MΩ → GND, 100 nF from ADC node to GND.
  ~2 µA continuous at 4.2 V. Halves 4.2 V to 2.1 V, inside the 3.3 V ADC
  range.
- Pico 2's own GP29 reads VSYS/3, which is LOAD minus a diode drop. That's
  not the battery voltage while USB charging, so the separate VBAT sense is
  still needed.

### Motor drivers

- Driver 1 (motor A): AO1/AO2 → A1/A2, BO1/BO2 → A3/A4.
- Driver 2 (motor B): AO1/AO2 → B1/B2, BO1/BO2 → B3/B4.
- Coil pairs A1-A2, A3-A4, B1-B2, B3-B4 were verified with a meter.
  Builder: check `components/bka30d.pdf` for which motor turns which shaft
  and label the drivers MIN/HOUR on silkscreen.
- **PWMA and PWMB tied to 3V3** (as in the breadboard diagram). Microstepping,
  if wanted, is done by PWM on the IN1/IN2 pins. Every RP2350 GPIO has PWM,
  and each IN1/IN2 pair should land on one PWM slice (consecutive even/odd
  GPIOs). This frees four GPIOs for the charger status lines.
- 100 nF decoupling on each driver's Vcc and Vmotor at the socket, plus a
  10 µF on each Vmotor (through-hole ceramic or electrolytic).

### RTC

- #5188 on its 8-pin header: Vin = 3V3, GND, SCL, SDA to I²C0, SQW to the
  wake GPIO. BAT, 32K, RST: socket pins only, not connected.
- The #5188 has 10 kΩ I²C pull-ups to Vin onboard, so none are added here.
- Silkscreen note by the socket: "CUT RTC LED JUMPER". Its power LED would
  draw more than the sleeping Pico does.
- Needs a CR1220 coin cell (not included with the board).

### Front-board sensors

- SNS_M, SNS_H: 47 kΩ pull-up to **GP13 (SNS_PWR)**, not 3V3, to ADC0/ADC1.
  (User, after review.) Sunlight can switch the phototransistors on, and a
  pull-up on the always-on rail would then draw up to 70 µA each, all day.
  Firmware drives GP13 high only while homing and low otherwise. That also
  lets firmware read ambient light with the LEDs off. Footprint for an
  optional 100 nF to GND on each (fit only if readings are noisy).
- LED_M, LED_H: straight to a GPIO each (firmware sets 12 mA drive).
- GND1, GND2: both to GND.

### Buttons (off-board)

Per button, on this board: 10 kΩ pull-up to 3V3 at the GPIO side, 1 kΩ
series from the wire pad to the GPIO, 1 µF from the GPIO to GND. The
button shorts its pad to GND. The pad group carries the four button
lines plus GND.

**Waking on a button press.** The RP2350's dormant mode can wake on an edge
or level on any GPIO, so a press wakes the Pico the same way the RTC alarm
does, and firmware then reads the buttons. The deeper POWMAN power-down
state allows only four GPIO wake sources, which is fewer than RTC + four
buttons. To keep that option open, **(my call)** add a diode-OR "any
button" line: a BAT43 Schottky (DO-35) from BTN_WAKE (anode) to each
button's wire pad (cathode, the pad side of the 1 kΩ, which sits at 0 V
while pressed), with BTN_WAKE pulled up to 3V3 by 100 kΩ. Wake-low is then
about 0.3 V, safely under the RP2350's 0.8 V input-low limit. A 1N4148 on the
debounced node would sit near 0.9 V, too close to call.
Any press pulls BTN_WAKE low. That makes two wake sources in all, RTC SQW
and BTN_WAKE. Costs four diodes and one resistor, and draws nothing at
rest.

### Starting pin map (builder may rearrange)

| GPIO | Use |
| --- | --- |
| GP0 / GP1 | I²C0 SDA / SCL (RTC) |
| GP2 | RTC SQW (wake) |
| GP3–GP6 | Buttons H+, H−, M+, M− |
| GP7 | STBY, both drivers (left high while asleep) |
| GP8 | Boost EN |
| GP9 | LED_M |
| GP10 | Charger CHG |
| GP11 | Charger PGOOD |
| GP12 | BTN_WAKE (diode-OR of all buttons) |
| GP13 | SNS_PWR: sensor pull-ups (test pad TP7) |
| GP14–GP17 | Driver 1 AIN1, AIN2, BIN1, BIN2 |
| GP18–GP21 | Driver 2 AIN1, AIN2, BIN1, BIN2 |
| GP22 | LED_H |
| GP26 / ADC0 | SNS_H |
| GP27 / ADC1 | SNS_M |
| GP28 / ADC2 | VBAT sense |
| GP29 / ADC3 | VSYS/3 (internal to Pico) |

## Connectors

**Solder-wire pads, no connectors.** (User: 22 AWG stranded wire soldered
between boards; JST-XH dropped from the BOM.) Same style as the front board's
J1: a row of plated holes at 2.54 mm pitch, each labelled on silkscreen.

- Holes sized for tinned 22 AWG stranded: ~1.2 mm drill, ~2.0 mm pad. Pitch
  may open up to 3.0 mm if 2.54 mm leaves too little copper between pads
  at that drill.
- Strain relief for each group: a pair of ~3 mm holes (or a 4 × 2 mm slot
  pair) just inboard of the pad row for a zip tie, so the cable bundle is
  held to the board and the solder joints don't flex.
- Wires enter from the side opposite the modules and are soldered on the
  module side, so the sockets never get in the way of the iron.
- Trade-off accepted: the charger and buttons can't be unplugged; removing
  the board means desoldering. The modules themselves stay socketed.

| Ref | Pads | Order |
| --- | --- | --- |
| Front | 14 | Same order as the front board's pads, so a ribbon of wires runs straight |
| Charger | 5 | LOAD, GND, VBAT (LIPO), CHG, PGOOD |
| Buttons | 5 | H+, H−, M+, M−, GND |

Current on LOAD/GND peaks around 150 mA while the motors move (BOM power
budget: ~132 mA from the battery), so 22 AWG has plenty of margin. Use
≥ 0.8 mm traces for LOAD, VSYS, 5V_SW and GND; signal traces can be thinner.

## Test points and markings

- Through-hole test loops: VBAT, LOAD, VSYS, 5V_SW, 3V3, GND.
- Silkscreen: every wire pad labelled, module outlines with orientation
  (Pico USB end, pin 1 marks), "CLOCK BRAIN Rev 1.0", the RTC LED jumper
  note, and "5V_SW: NEVER TO VSYS" near the boost.

## Left to the builder

- Exact header order, pitch and row spacing for each Adafruit module. The
  product pages don't state them; take them from Adafruit's published
  Eagle/Fritzing files on GitHub and the Pico 2 datasheet's mechanical
  section, and list the figures in the plan so the user can check them
  against the real boards with calipers before ordering.
- Placement, routing, trace widths beyond the minimums above, mounting hole
  positions, final pin map, board thickness.
- Part values marked as checks above (EN pull-down, CHG/PGOOD with the
  charger's LEDs).
- Fab README and BOM in `back/fab/`, like `front/fab/`.
