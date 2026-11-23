import { Fragment } from "react"
import { PAD_ORDER } from "../front/front.circuit"
import { DS3231Breakout } from "../lib/DS3231Breakout"
import { MiniBoost } from "../lib/MiniBoost"
import { Pico2 } from "../lib/Pico2"
import { TB6612Breakout } from "../lib/TB6612Breakout"
import { WirePads } from "../lib/WirePads"
import { GPIO, gp } from "./pinmap"

/**
 * Brain board: a carrier for plug-in modules, mounted on the back plate of the
 * clock housing. See docs/superpowers/specs/2026-11-22-brain-board-design.md.
 *
 *  U1 Pico 2 · U2/U3 TB6612 (#2448) for BKA30D motors A/B · U4 MiniBoost
 *  (#4654) · U5 DS3231 (#5188). Wires are soldered to J1 (front board),
 *  J2 (bq24074 charger) and J3 (buttons).
 *
 * Power: charger LOAD -> D1 -> Pico VSYS, and LOAD -> MiniBoost -> 5V_SW for
 * the motor drivers only. Boost EN is pulled low (R1), so the motors have no
 * supply until the Pico drives GP8 high. STBY deliberately has no pull-down:
 * the TB6612s' own 10 kΩ pull-ups would make it leak ~0.55 mA in sleep.
 */

const AXIAL_RES = "axial_p0.4in_id0.8mm_od1.6mm"
const SCHOTTKY_1A = "axial_p0.4in_id1.2mm_od2mm" // 1N5817, DO-41
const SCHOTTKY_SIGNAL = "axial_p0.3in_id0.8mm_od1.6mm" // BAT43, DO-35
const CERAMIC = "radial_p2.54mm"
const ELECTROLYTIC = "radial_p2.5mm"

const pico = (n: number) => `U1.${gp(n)}`

/** Placement of every small part: [x, y, rotation] in board mm (origin = centre) */
const P: Record<string, [number, number, number]> = {
  D1: [38, 4, 0],
  C1: [30, 12, 0],
  R1: [46, 10, 90],
  R2: [-36, -15, 0],
  R3: [36, -4, 0],
  R4: [36, -9, 0],
  R5: [36, -14, 0],
  R6: [36, -19, 0],
  C8: [36, -24, 0],
  R7: [-20, 1, 90],
  R8: [-16, 1, 90],
  C9: [-11, 1, 90],
  C10: [-5, 1, 90],
  R9: [-20, -14, 90],
  R10: [-16, -14, 90],
  R11: [-12, -14, 90],
  R12: [-8, -14, 90],
  C11: [-2.5, -14, 90],
  C12: [3.5, -14, 90],
  C13: [9.5, -14, 90],
  C14: [15.5, -14, 90],
  R17: [20, -14, 90],
  R13: [-20, -28, 90],
  R14: [-16, -28, 90],
  R15: [-12, -28, 90],
  R16: [-8, -28, 90],
  D2: [-4, -28, 90],
  D3: [0, -28, 90],
  D4: [4, -28, 90],
  D5: [8, -28, 90],
  C2: [-22, 39, 0],
  C4: [-16, 39, 0],
  C6: [-10, 39, 0],
  C3: [2.5, 30, 90],
  C5: [2.5, 24, 90],
  C7: [2.5, 18, 90],
  TP1: [47, -2, 0],
  TP2: [47, -6, 0],
  TP3: [47, -10, 0],
  TP4: [47, -14, 0],
  TP5: [47, -18, 0],
  TP6: [47, -22, 0],
  TP7: [47, -26, 0],
}

/** pcbX/pcbY/pcbRotation props for a part from P */
const at = (name: string) => {
  const [pcbX, pcbY, pcbRotation] = P[name]
  return { pcbX, pcbY, pcbRotation }
}

/** The four button channels: J3 pad, series R, pull-up, cap, wake diode, GPIO */
const BUTTONS = [
  { pad: "HP", series: "R13", pullup: "R9", cap: "C11", diode: "D2", gpio: GPIO.BTN_HP },
  { pad: "HM", series: "R14", pullup: "R10", cap: "C12", diode: "D3", gpio: GPIO.BTN_HM },
  { pad: "MP", series: "R15", pullup: "R11", cap: "C13", diode: "D4", gpio: GPIO.BTN_MP },
  { pad: "MM", series: "R16", pullup: "R12", cap: "C14", diode: "D5", gpio: GPIO.BTN_MM },
] as const

/** Motor wire pad -> driver output */
const MOTOR_WIRES = [
  ["A1", "U2.MOTORA1"], ["A2", "U2.MOTORA2"], ["A3", "U2.MOTORB1"], ["A4", "U2.MOTORB2"],
  ["B1", "U3.MOTORA1"], ["B2", "U3.MOTORA2"], ["B3", "U3.MOTORB1"], ["B4", "U3.MOTORB2"],
] as const

const PICO_GNDS = ["GND1", "GND2", "GND3", "GND4", "GND5", "GND6", "GND7", "AGND"]

/** One connection. */
const T = ({ from, to }: { from: string; to: string }) => <trace from={from} to={to} />

export default () => (
  <board width="100mm" height="96mm" layers={2} defaultTraceWidth="0.3mm" minTraceWidth="0.3mm" routeRemaining>
    <net name="LOAD" isPowerNet />
    <net name="VSYS" isPowerNet />
    <net name="V5_SW" isPowerNet />
    <net name="V3_3" isPowerNet />
    <net name="GND" isGroundNet />

    {/* M3 mounting holes, 4 mm in from each corner */}
    {[[-46, 44], [46, 44], [-46, -44], [46, -44]].map(([x, y]) => (
      <hole key={`${x},${y}`} pcbX={x} pcbY={y} diameter={3.2} />
    ))}

    {/* ---------- Modules ---------- */}
    <Pico2 name="U1" pcbX={-36} pcbY={16} />
    <TB6612Breakout name="U2" pcbX={-11} pcbY={22} />
    <TB6612Breakout name="U3" pcbX={16} pcbY={22} />
    <MiniBoost name="U4" pcbX={40} pcbY={26} />
    <DS3231Breakout name="U5" pcbX={-36} pcbY={-30} />

    {/* ---------- Wire pads ---------- */}
    <WirePads name="J1" pads={PAD_ORDER} pcbX={14} pcbY={42} />
    <WirePads name="J2" pads={["LOAD", "GND", "VBAT", "CHG", "PGOOD"]} pcbX={32} pcbY={-40} />
    <WirePads
      name="J3"
      pads={["HP", "HM", "MP", "MM", "GND"]}
      silk={["H+", "H-", "M+", "M-", "GND"]}
      pcbX={2}
      pcbY={-40}
    />

    {/* ---------- Power ---------- */}
    <diode name="D1" {...at("D1")} footprint={SCHOTTKY_1A} manufacturerPartNumber="1N5817" />
    <capacitor name="C1" {...at("C1")} capacitance="100uF" polarized footprint={ELECTROLYTIC} maxVoltageRating="16V" />
    <T from="J2.LOAD" to="net.LOAD" />
    <T from="U4.VIN" to="net.LOAD" />
    <T from="D1.anode" to="net.LOAD" />
    <T from="D1.cathode" to="net.VSYS" />
    <T from="U1.VSYS" to="net.VSYS" />
    <T from="U4.VOUT" to="net.V5_SW" />
    <T from="U2.VM" to="net.V5_SW" />
    <T from="U3.VM" to="net.V5_SW" />
    <T from="C1.pin1" to="net.V5_SW" />
    <T from="C1.pin2" to="net.GND" />
    <T from=".U1 > .3V3" to="net.V3_3" />
    {["U2", "U3"].map((u) => (
      <Fragment key={u}>
        <T from={`${u}.VCC`} to="net.V3_3" />
        <T from={`${u}.PWMA`} to="net.V3_3" />
        <T from={`${u}.PWMB`} to="net.V3_3" />
        <T from={`${u}.GND1`} to="net.GND" />
        <T from={`${u}.GND2`} to="net.GND" />
        <T from={`${u}.GND3`} to="net.GND" />
      </Fragment>
    ))}
    {PICO_GNDS.map((g) => (
      <T key={g} from={`U1.${g}`} to="net.GND" />
    ))}
    <T from="U4.GND" to="net.GND" />
    <T from="U5.GND" to="net.GND" />
    <T from="J1.GND1" to="net.GND" />
    <T from="J1.GND2" to="net.GND" />
    <T from="J2.GND" to="net.GND" />
    <T from="J3.GND" to="net.GND" />

    {/* Driver decoupling: 100 nF on each VCC, 100 nF + 10 µF on each VM.
        Tied by net, not pin to pin: tscircuit caps a direct cap-to-pin trace
        at 1 mm. Placement keeps them beside their driver's socket. */}
    {[
      ["C2", "net.V3_3", "100nF"], ["C3", "net.V3_3", "100nF"],
      ["C4", "net.V5_SW", "100nF"], ["C5", "net.V5_SW", "100nF"],
      ["C6", "net.V5_SW", "10uF"], ["C7", "net.V5_SW", "10uF"],
    ].map(([name, pin, value]) => (
      <Fragment key={name}>
        <capacitor name={name} {...at(name)} capacitance={value} footprint={CERAMIC} />
        <T from={`${name}.pin1`} to={pin} />
        <T from={`${name}.pin2`} to="net.GND" />
      </Fragment>
    ))}

    {/* ---------- Motor drivers ---------- */}
    <T from={pico(GPIO.STBY)} to="U2.STBY" />
    <T from={pico(GPIO.STBY)} to="U3.STBY" />
    <T from={pico(GPIO.A_AIN1)} to="U2.AIN1" />
    <T from={pico(GPIO.A_AIN2)} to="U2.AIN2" />
    <T from={pico(GPIO.A_BIN1)} to="U2.BIN1" />
    <T from={pico(GPIO.A_BIN2)} to="U2.BIN2" />
    <T from={pico(GPIO.B_AIN1)} to="U3.AIN1" />
    <T from={pico(GPIO.B_AIN2)} to="U3.AIN2" />
    <T from={pico(GPIO.B_BIN1)} to="U3.BIN1" />
    <T from={pico(GPIO.B_BIN2)} to="U3.BIN2" />
    {MOTOR_WIRES.map(([pad, out]) => (
      <T key={pad} from={`J1.${pad}`} to={out} />
    ))}

    {/* Boost enable: 4.7 kΩ against the MiniBoost's 100 kΩ pull-up -> off by default */}
    <resistor name="R1" {...at("R1")} resistance="4.7k" footprint={AXIAL_RES} />
    <T from={pico(GPIO.BOOST_EN)} to="U4.EN" />
    <T from="R1.pin1" to="U4.EN" />
    <T from="R1.pin2" to="net.GND" />

    {/* ---------- RTC ---------- */}
    <T from="U5.VIN" to="net.V3_3" />
    <T from={pico(GPIO.SDA)} to="U5.SDA" />
    <T from={pico(GPIO.SCL)} to="U5.SCL" />
    <T from={pico(GPIO.RTC_SQW)} to="U5.SQW" />
    <resistor name="R2" {...at("R2")} resistance="10k" footprint={AXIAL_RES} />
    <T from="R2.pin1" to="U5.SQW" />
    <T from="R2.pin2" to="net.V3_3" />

    {/* ---------- Charger status and battery sense ---------- */}
    <resistor name="R3" {...at("R3")} resistance="100k" footprint={AXIAL_RES} />
    <resistor name="R4" {...at("R4")} resistance="100k" footprint={AXIAL_RES} />
    <T from="J2.CHG" to={pico(GPIO.CHG)} />
    <T from="R3.pin1" to="J2.CHG" />
    <T from="R3.pin2" to="net.V3_3" />
    <T from="J2.PGOOD" to={pico(GPIO.PGOOD)} />
    <T from="R4.pin1" to="J2.PGOOD" />
    <T from="R4.pin2" to="net.V3_3" />

    {/* VBAT / 2 into ADC2: ~2 µA at 4.2 V */}
    <resistor name="R5" {...at("R5")} resistance="1M" footprint={AXIAL_RES} />
    <resistor name="R6" {...at("R6")} resistance="1M" footprint={AXIAL_RES} />
    <capacitor name="C8" {...at("C8")} capacitance="100nF" footprint={CERAMIC} />
    <T from="J2.VBAT" to="net.VBAT" />
    <T from="R5.pin1" to="net.VBAT" />
    <T from="R5.pin2" to="net.VBAT_ADC" />
    <T from="R6.pin1" to="net.VBAT_ADC" />
    <T from="R6.pin2" to="net.GND" />
    <T from="C8.pin1" to="net.VBAT_ADC" />
    <T from="C8.pin2" to="net.GND" />
    <T from={pico(GPIO.VBAT)} to="net.VBAT_ADC" />

    {/* ---------- Front-board sensors ---------- */}
    <T from="J1.LED_M" to={pico(GPIO.LED_M)} />
    <T from="J1.LED_H" to={pico(GPIO.LED_H)} />
    <T from="J1.SNS_M" to="net.SNS_M" />
    <T from={pico(GPIO.SNS_M)} to="net.SNS_M" />
    <T from="J1.SNS_H" to="net.SNS_H" />
    <T from={pico(GPIO.SNS_H)} to="net.SNS_H" />
    {/* Pull-ups powered from GP13, not 3V3: sunlight can switch the
        phototransistors on, and firmware drives GP13 low while asleep */}
    <T from={pico(GPIO.SNS_PWR)} to="net.SNS_PWR" />
    <resistor name="R7" {...at("R7")} resistance="47k" footprint={AXIAL_RES} />
    <resistor name="R8" {...at("R8")} resistance="47k" footprint={AXIAL_RES} />
    <T from="R7.pin1" to="net.SNS_M" />
    <T from="R7.pin2" to="net.SNS_PWR" />
    <T from="R8.pin1" to="net.SNS_H" />
    <T from="R8.pin2" to="net.SNS_PWR" />
    {/* optional: fit only if the ADC readings are noisy */}
    <capacitor name="C9" {...at("C9")} capacitance="100nF" footprint={CERAMIC} />
    <capacitor name="C10" {...at("C10")} capacitance="100nF" footprint={CERAMIC} />
    <T from="C9.pin1" to="net.SNS_M" />
    <T from="C9.pin2" to="net.GND" />
    <T from="C10.pin1" to="net.SNS_H" />
    <T from="C10.pin2" to="net.GND" />

    {/* ---------- Buttons: 1 kΩ series, 10 kΩ pull-up, 1 µF; BAT43 OR to BTN_WAKE ---------- */}
    {BUTTONS.map((b) => (
      <Fragment key={b.pad}>
        <resistor name={b.series} {...at(b.series)} resistance="1k" footprint={AXIAL_RES} />
        <resistor name={b.pullup} {...at(b.pullup)} resistance="10k" footprint={AXIAL_RES} />
        <capacitor name={b.cap} {...at(b.cap)} capacitance="1uF" footprint={CERAMIC} />
        <diode name={b.diode} {...at(b.diode)} footprint={SCHOTTKY_SIGNAL} manufacturerPartNumber="BAT43" />
        <T from={`J3.${b.pad}`} to={`${b.series}.pin1`} />
        <T from={`J3.${b.pad}`} to={`${b.diode}.cathode`} />
        <T from={`${b.series}.pin2`} to={`net.BTN_${b.pad}`} />
        <T from={pico(b.gpio)} to={`net.BTN_${b.pad}`} />
        <T from={`${b.pullup}.pin1`} to={`net.BTN_${b.pad}`} />
        <T from={`${b.pullup}.pin2`} to="net.V3_3" />
        <T from={`${b.cap}.pin1`} to={`net.BTN_${b.pad}`} />
        <T from={`${b.cap}.pin2`} to="net.GND" />
        <T from={`${b.diode}.anode`} to="net.BTN_WAKE" />
      </Fragment>
    ))}
    <resistor name="R17" {...at("R17")} resistance="100k" footprint={AXIAL_RES} />
    <T from={pico(GPIO.BTN_WAKE)} to="net.BTN_WAKE" />
    <T from="R17.pin1" to="net.BTN_WAKE" />
    <T from="R17.pin2" to="net.V3_3" />

    {/* ---------- Test points ---------- */}
    {[
      ["TP1", "net.VBAT"], ["TP2", "net.LOAD"], ["TP3", "net.VSYS"], ["TP4", "net.V5_SW"],
      ["TP5", "net.V3_3"], ["TP6", "net.GND"], ["TP7", "net.SNS_PWR"],
    ].map(([name, to]) => (
      <Fragment key={name}>
        <testpoint name={name} {...at(name)} footprintVariant="through_hole" holeDiameter="1mm" padDiameter="2mm" />
        <T from={`${name}.pin1`} to={to} />
      </Fragment>
    ))}
  </board>
)
