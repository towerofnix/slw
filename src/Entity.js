// @flow

// show bounding boxes, among other things
const DEBUG = true

import SLW from './SLW'
import Tile from './Tile'

import { sign } from './util'

export default class Entity {
  // Position, absolute (not tileX/Y!)
  x: number
  y: number

  // Velocity
  xv: number
  yv: number

  // Dimensions (used for bounding box)
  w: number // width
  h: number // height

  color: string // "rgba(r, g, b, a)"

  get top(): number {
    return Math.floor(this.y)
  }

  get bottom(): number {
    return Math.floor(this.y + this.h)
  }

  get left(): number {
    return Math.floor(this.x)
  }

  get right(): number {
    return Math.floor(this.x + this.w)
  }

  constructor() {
    this.x = 0
    this.y = 0

    this.xv = 0
    this.yv = 0

    this.w = 16
    this.h = 16

    // pleasing color for debugging reasons :P
    const c = require('pleasejs').make_color({ format: 'rgb' })[0]
    this.color = `rgba(${c.r}, ${c.g}, ${c.b}, 0.75)`
  }

  update(game: SLW) {
    let v: number = 0

    // x:
    const xv = Math.floor(this.xv)
    v = sign(xv)

    for (let i = 0; i < Math.abs(xv); i++) {
      this.x += v
      if (this.collides) {
        this.x -= v
        this.xv = 0
      }
    }

    // y:
    const yv = Math.floor(this.yv)
    v = sign(yv)

    for (let i = 0; i < Math.abs(yv); i++) {
      this.y += v
      if (this.collides) {
        this.y -= v
        this.yv = 0

        const tileAboveX = Math.round(this.left / Tile.size)
        const tileAboveY = this.top / Tile.size - 1
        const tileAbove = Tile.at([tileAboveX, tileAboveY])

        if (tileAbove.interaction.airPunched) {
          tileAbove.interaction.airPunched.apply({
            x: tileAboveX, y: tileAboveY, player: this
          })
        }
      }
    }
  }

  draw(game: SLW) {
    const ctx = game.canvas.getContext('2d')
    if (!(ctx instanceof CanvasRenderingContext2D)) return

    if (DEBUG) {
      // Draw the bounding box.
      ctx.fillStyle = this.color
      ctx.fillRect(this.left, this.top, this.w + 1, this.h + 1)
    }
  }

  // Are we currently intersecting any solid Tiles?
  get collides(): boolean {
    let tileLeft   = Math.floor(this.left   / Tile.size)
    let tileRight  = Math.floor(this.right  / Tile.size)
    let tileTop    = Math.floor(this.top    / Tile.size)
    let tileBottom = Math.floor(this.bottom / Tile.size)

    const levelWidth  = window.game.activeLevel.tiles.split('\n')[0].length - 1
    const levelHeight = window.game.activeLevel.tiles.split('\n').length    - 1

    if (tileLeft < 0)             tileLeft = 0
    if (tileRight > levelWidth)   tileRight = levelWidth
    if (tileTop < 0)              tileTop = 0
    if (tileBottom > levelHeight) tileBottom = levelHeight

    let collision = false
    for (let x = tileLeft; x <= tileRight; x++) {
      for (let y = tileTop; y <= tileBottom; y++) {
        let tile = Tile.at([x, y])

        if (tile.solid) collision = true
      }
    }

    return collision
  }

  // Whether or not the entity is on the ground or not.
  get grounded(): boolean {
    // Check if either the tile below the player to the LEFT or the tile below
    // the player to the RIGHT is solid.
    return (
      Tile.at([Math.floor(this.x / 16), this.bottom / 16 + 0.1]).solid ||
      Tile.at([Math.ceil(this.x / 16), this.bottom / 16 + 0.1]).solid
    )
  }
}

export class Player extends Entity {
  jumpSound: window.Audio

  constructor(x: number = 0, y:number = 0) {
    super()

    this.x = x
    this.y = y

    this.w = 16
    this.h = 24

    this.jumpSound = new window.Audio('sound/smw_jump.wav')
  }

  update(game: SLW) {
    if (game.keys[39]) {
      this.xv += 1
    }

    if (game.keys[37]) {
      // xv
      this.xv -= 1
    }

    if (!game.keys[39] && !game.keys[37]) {
      // slow down
      this.xv += sign(this.xv) * -0.5
    }

    if (this.grounded && game.keys[32]) {
      // jump
      this.yv = -4
      this.jumpSound.play()
    }

    this.xv = Math.min(this.xv,  3)
    this.xv = Math.max(this.xv, -3)
    this.yv = Math.min(this.yv,  4)

    this.yv += 0.25 // TODO actual gravity

    super.update(game)
  }
}
