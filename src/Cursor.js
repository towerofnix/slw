// @flow

import type {Position} from './types'

// Generic Cursor class designed to be easy to implement multiple control
// schemes for. For example, mouse, tablet touch, and gamepad are all possible
// controls that could be implemented.
export default class Cursor {

  // Position of the cursor.
  pos: Position

  // Whether the cursor is pressed or not.
  down: boolean

  // Cursor image to be drawn. This image's source is (by default)
  // cursor.png, loaded from the sprites folder.
  image: Image

  constructor() {
    this.pos = [0, 0]
    this.down = false
    this.image = new Image()
    this.image.src = 'sprites/cursor.png'
  }

  // Watch the mouse's movement on an element, and use its position as the
  // position for this cursor.
  watchMouse(el: Element) {
    el.addEventListener('mousemove', (evt: MouseEvent) => {
      // Stored position should be relative to element's rendered bounds.
      let rect = el.getBoundingClientRect()
      this.pos[0] = evt.clientX - rect.left
      this.pos[1] = evt.clientY - rect.top
    })

    el.addEventListener('mouseup', () => {
      this.down = false
    })

    el.addEventListener('mousedown', () => {
      this.down = true
    })
  }

  // Draw using an already-created canvas context. Optionally takes an X/Y
  // position to draw at, which defaults to this.pos[0, 1].
  drawUsingCtx(
    ctx: CanvasRenderingContext2D,
    x: number = this.pos[0], y: number = this.pos[1]
  ) {
    const centeredX = x - this.image.width / 2
    const centeredY = y - this.image.height / 2
    ctx.drawImage(this.image, centeredX, centeredY)
  }
}
