/**
 * Brain board GPIO assignments (Raspberry Pi Pico 2 / RP2350).
 *
 * The board and its tests both read this table, and firmware should too.
 * Each IN1/IN2 pair sits on one PWM slice (even GPIO, then the next odd one)
 * so microstepping can PWM both inputs of an H-bridge together.
 */
export const GPIO = {
  SDA: 0,
  SCL: 1,
  RTC_SQW: 2, // active low, wakes from dormant
  BTN_HP: 3,
  BTN_HM: 4,
  BTN_MP: 5,
  BTN_MM: 6,
  STBY: 7, // both drivers; leave high while asleep
  BOOST_EN: 8, // high = 5V_SW on
  LED_M: 9,
  CHG: 10, // active low
  PGOOD: 11, // active low
  BTN_WAKE: 12, // active low, any button
  SPARE: 13,
  A_AIN1: 14,
  A_AIN2: 15,
  A_BIN1: 16,
  A_BIN2: 17,
  B_AIN1: 18,
  B_AIN2: 19,
  B_BIN1: 20,
  B_BIN2: 21,
  LED_H: 22,
  SNS_H: 26, // ADC0
  SNS_M: 27, // ADC1
  VBAT: 28, // ADC2, battery / 2
} as const

/** Pico pin label for a GPIO number. */
export const gp = (n: number) => `GP${n}`
