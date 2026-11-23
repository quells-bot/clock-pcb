import { describe, expect, test } from "bun:test"
import { GPIO } from "../back/pinmap"
import Front, { PAD_ORDER } from "../front/front.circuit"
import { isConnected, renderCircuit } from "./helpers/netlist"

describe("pin map", () => {
  test("no GPIO is used twice", () => {
    const pins = Object.values(GPIO)
    expect(new Set(pins).size).toBe(pins.length)
  })

  test("IN1/IN2 pairs share a PWM slice", () => {
    const pairs: Array<[number, number]> = [
      [GPIO.A_AIN1, GPIO.A_AIN2],
      [GPIO.A_BIN1, GPIO.A_BIN2],
      [GPIO.B_AIN1, GPIO.B_AIN2],
      [GPIO.B_BIN1, GPIO.B_BIN2],
    ]
    for (const [a, b] of pairs) {
      expect(a % 2).toBe(0)
      expect(b).toBe(a + 1)
    }
  })

  test("analog signals are on ADC pins", () => {
    for (const pin of [GPIO.SNS_H, GPIO.SNS_M, GPIO.VBAT]) {
      expect([26, 27, 28] as number[]).toContain(pin)
    }
  })
})

describe("front board", () => {
  test("pad order is the Rev 1.0 order", () => {
    expect([...PAD_ORDER]).toEqual([
      "B3", "B4", "A2", "A1", "LED_M", "SNS_M", "GND1",
      "A3", "A4", "B1", "B2", "SNS_H", "LED_H", "GND2",
    ])
  })

  test("harness sees the GND pads joined", () => {
    expect(isConnected(renderCircuit(<Front />), "J1.GND1", "J1.GND2")).toBe(true)
  })
})
