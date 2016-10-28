// @flow
// General utility functions.

// Gets the sign of a number, as a number. If the given number is negative,
// it returns -1, if positive, 1, and if zero, 0.
export function sign(n: number): number {
  if (n > 0) return 1
  if (n < 0) return -1
  return 0
}

// Returns andom integer from `min` through `max`.
export function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * max) + min
}
