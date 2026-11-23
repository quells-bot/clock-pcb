import { beforeAll, describe, expect, test } from "bun:test"
import Brain from "../back/brain.circuit"
import { GPIO, gp } from "../back/pinmap"
import { isConnected, netMembers, renderCircuit } from "./helpers/netlist"

let cj: any[]
beforeAll(() => {
  cj = renderCircuit(<Brain />) as any[]
})

const pico = (n: number) => `U1.${gp(n)}`
const connectedPairs = (pairs: Array<[string, string]>) =>
  test.each(pairs)("%s — %s", (a, b) => {
    expect(isConnected(cj, a, b)).toBe(true)
  })

const PICO_GNDS = ["GND1", "GND2", "GND3", "GND4", "GND5", "GND6", "GND7", "AGND"].map((g) => `U1.${g}`)

describe("power", () => {
  connectedPairs([
    ["J2.LOAD", "U4.VIN"],
    ["J2.LOAD", "D1.anode"],
    ["D1.cathode", "U1.VSYS"],
    ["U4.VOUT", "U2.VM"],
    ["U4.VOUT", "U3.VM"],
    ["U4.VOUT", "C1.pin1"],
    ["U1.3V3", "U2.VCC"],
    ["U1.3V3", "U3.VCC"],
    ["U1.3V3", "U5.VIN"],
    ["U1.3V3", "U2.PWMA"],
    ["U1.3V3", "U2.PWMB"],
    ["U1.3V3", "U3.PWMA"],
    ["U1.3V3", "U3.PWMB"],
  ])
})

describe("ground", () => {
  const grounds = [
    ...PICO_GNDS,
    "U2.GND1", "U2.GND2", "U2.GND3",
    "U3.GND1", "U3.GND2", "U3.GND3",
    "U4.GND", "U5.GND",
    "J1.GND1", "J1.GND2", "J2.GND", "J3.GND",
    "C1.pin2",
  ]
  connectedPairs(grounds.map((g) => ["U1.GND1", g] as [string, string]))
})

describe("RTC", () => {
  connectedPairs([
    [pico(GPIO.SDA), "U5.SDA"],
    [pico(GPIO.SCL), "U5.SCL"],
    [pico(GPIO.RTC_SQW), "U5.SQW"],
    ["U5.SQW", "R2.pin1"],
    ["R2.pin2", "U1.3V3"],
  ])
})

describe("drivers", () => {
  connectedPairs([
    [pico(GPIO.STBY), "U2.STBY"],
    [pico(GPIO.STBY), "U3.STBY"],
    [pico(GPIO.BOOST_EN), "U4.EN"],
    ["U4.EN", "R1.pin1"],
    ["R1.pin2", "U1.GND1"],
    [pico(GPIO.A_AIN1), "U2.AIN1"],
    [pico(GPIO.A_AIN2), "U2.AIN2"],
    [pico(GPIO.A_BIN1), "U2.BIN1"],
    [pico(GPIO.A_BIN2), "U2.BIN2"],
    [pico(GPIO.B_AIN1), "U3.AIN1"],
    [pico(GPIO.B_AIN2), "U3.AIN2"],
    [pico(GPIO.B_BIN1), "U3.BIN1"],
    [pico(GPIO.B_BIN2), "U3.BIN2"],
  ])
})

describe("motor wires", () => {
  connectedPairs([
    ["J1.A1", "U2.MOTORA1"],
    ["J1.A2", "U2.MOTORA2"],
    ["J1.A3", "U2.MOTORB1"],
    ["J1.A4", "U2.MOTORB2"],
    ["J1.B1", "U3.MOTORA1"],
    ["J1.B2", "U3.MOTORA2"],
    ["J1.B3", "U3.MOTORB1"],
    ["J1.B4", "U3.MOTORB2"],
  ])
})

describe("sensors", () => {
  connectedPairs([
    ["J1.LED_M", pico(GPIO.LED_M)],
    ["J1.LED_H", pico(GPIO.LED_H)],
    ["J1.SNS_M", pico(GPIO.SNS_M)],
    ["J1.SNS_H", pico(GPIO.SNS_H)],
    ["J1.SNS_M", "R7.pin1"],
    ["R7.pin2", "U1.3V3"],
    ["J1.SNS_H", "R8.pin1"],
    ["R8.pin2", "U1.3V3"],
  ])
})

describe("decoupling", () => {
  connectedPairs([
    ["C2.pin1", "U2.VCC"], ["C2.pin2", "U1.GND1"],
    ["C3.pin1", "U3.VCC"], ["C3.pin2", "U1.GND1"],
    ["C4.pin1", "U2.VM"], ["C4.pin2", "U1.GND1"],
    ["C6.pin1", "U2.VM"], ["C6.pin2", "U1.GND1"],
    ["C5.pin1", "U3.VM"], ["C5.pin2", "U1.GND1"],
    ["C7.pin1", "U3.VM"], ["C7.pin2", "U1.GND1"],
    ["C9.pin1", "J1.SNS_M"], ["C9.pin2", "U1.GND1"],
    ["C10.pin1", "J1.SNS_H"], ["C10.pin2", "U1.GND1"],
  ])
})

describe("charger", () => {
  connectedPairs([
    ["J2.CHG", pico(GPIO.CHG)],
    ["J2.CHG", "R3.pin1"],
    ["R3.pin2", "U1.3V3"],
    ["J2.PGOOD", pico(GPIO.PGOOD)],
    ["J2.PGOOD", "R4.pin1"],
    ["R4.pin2", "U1.3V3"],
    ["J2.VBAT", "R5.pin1"],
    ["R5.pin2", "R6.pin1"],
    ["R5.pin2", pico(GPIO.VBAT)],
    ["R5.pin2", "C8.pin1"],
    ["R6.pin2", "U1.GND1"],
    ["C8.pin2", "U1.GND1"],
  ])
})

describe("buttons", () => {
  const buttons: Array<[string, string, string, string, string, number]> = [
    ["HP", "R13", "R9", "C11", "D2", GPIO.BTN_HP],
    ["HM", "R14", "R10", "C12", "D3", GPIO.BTN_HM],
    ["MP", "R15", "R11", "C13", "D4", GPIO.BTN_MP],
    ["MM", "R16", "R12", "C14", "D5", GPIO.BTN_MM],
  ]
  for (const [pad, series, pullup, cap, diode, n] of buttons) {
    connectedPairs([
      [`J3.${pad}`, `${series}.pin1`],
      [`J3.${pad}`, `${diode}.cathode`],
      [`${series}.pin2`, pico(n)],
      [`${pullup}.pin1`, pico(n)],
      [`${pullup}.pin2`, "U1.3V3"],
      [`${cap}.pin1`, pico(n)],
      [`${cap}.pin2`, "U1.GND1"],
      [`${diode}.anode`, pico(GPIO.BTN_WAKE)],
    ])
    test(`${pad}: the wake diode is on the pad side, not the GPIO side`, () => {
      expect(isConnected(cj, `${diode}.cathode`, pico(n))).toBe(false)
    })
  }
  connectedPairs([
    [pico(GPIO.BTN_WAKE), "R17.pin1"],
    ["R17.pin2", "U1.3V3"],
  ])
})

describe("test points", () => {
  connectedPairs([
    ["TP1.pin1", "J2.VBAT"],
    ["TP2.pin1", "J2.LOAD"],
    ["TP3.pin1", "U1.VSYS"],
    ["TP4.pin1", "U4.VOUT"],
    ["TP5.pin1", "U1.3V3"],
    ["TP6.pin1", "U1.GND1"],
    ["TP7.pin1", pico(GPIO.SPARE)],
  ])
})

describe("isolation", () => {
  const notConnected = (a: string, b: string) =>
    test(`${a} is not connected to ${b}`, () => {
      expect(isConnected(cj, a, b)).toBe(false)
    })
  for (const b of ["U1.VSYS", "U1.VBUS", "U1.3V3", "J2.LOAD", "U1.GND1"]) notConnected("U4.VOUT", b)
  for (const n of Object.values(GPIO)) notConnected("U4.VOUT", pico(n))
  notConnected("J2.LOAD", "U1.3V3")
  notConnected("J2.LOAD", "U1.VSYS")

  test("Pico VBUS is left unconnected", () => {
    expect(netMembers(cj, "U1.VBUS")).toEqual(["U1.VBUS"])
  })
})

describe("standby leakage", () => {
  test("only R1 and R6 put a resistor on GND", () => {
    const onGnd = netMembers(cj, "U1.GND1")
      .filter((m) => /^R\d+\./.test(m))
      .map((m) => m.split(".")[0])
      .sort()
    expect(onGnd).toEqual(["R1", "R6"])
  })

  test("no resistor on the STBY net", () => {
    expect(netMembers(cj, pico(GPIO.STBY)).filter((m) => /^R\d+\./.test(m))).toEqual([])
  })

  test("EN has nothing to 3V3", () => {
    expect(isConnected(cj, "U4.EN", "U1.3V3")).toBe(false)
  })
})
