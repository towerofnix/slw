// @flow
// General utility functions.

// Gets the sign of a number, as a number. If the given number is negative,
// it returns -1, if positive, 1, and if zero, 0.
export function sign(n: number): number {
  if (n > 0) return 1
  if (n < 0) return -1
  return 0
}

// Returns a random integer from `min` through `max`.
export function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * max) + min
}

// Returns an image written over by a colour, taking an operation type and alpha.
// Default values useful for masking.
export function tint(img: Image, colour: string, operation: string = 'source-in', alpha: number = 1) {
  // create hidden canvas (using image dimensions)
  let canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height

  let ctx = canvas.getContext('2d')
  if (!ctx) throw new TypeError('Failed to get new canvas context.')
  ctx.drawImage(img, 0, 0)

  // overlay filled rectangle using lighter composition
  ctx.globalCompositeOperation = operation
  ctx.globalAlpha = alpha
  ctx.fillStyle = colour
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // return a new image
  let res = new Image
  res.src = canvas.toDataURL()
  return res
}
