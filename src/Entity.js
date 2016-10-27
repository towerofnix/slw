// @flow

const DEBUG = true // show bounding boxes
const GRAVITY = 0.25

import SLW from './SLW'
import Tile from './Tile'

import { sign } from './util'

export class Entity {
  game: SLW

  // Position, absolute (not tileX/Y!)
  x: number
  y: number

  // Velocity
  xv: number
  yv: number

  // Dimensions (used for bounding box)
  w: number // width
  h: number // height

  sprite: Image

  color: string

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

  constructor(game: SLW) {
    this.game = game
    this.sprite = game.level.entityImages[this.constructor.name]

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

  update() {
    let v: number = 0

    // x:
    const xv = Math.floor(this.xv)
    v = sign(xv)

    for (let i = 0; i < Math.abs(xv); i++) {
      this.x += v
      if (this.collides()) {
        this.x -= v
        this.xv = 0
      }
    }

    // y:
    const yv = Math.floor(this.yv)
    v = sign(yv)

    for (let i = 0; i < Math.abs(yv); i++) {
      this.y += v
      if (this.collides()) {
        this.y -= v
        this.yv = 0

        const tileAboveX = Math.round(this.left / Tile.size)
        const tileAboveY = this.top / Tile.size - 1
        const tileAbove = this.game.level.tileAt([tileAboveX, tileAboveY])

        tileAbove.onAirPunch()
      }
    }

    this.collides(true).forEach(tile => tile.onTouch(this))
  }

  draw() {
    const ctx = this.game.canvas.getContext('2d')
    if (!(ctx instanceof CanvasRenderingContext2D)) return

    if (DEBUG) {
      // Draw the bounding box (if in DEBUG mode).
      ctx.strokeStyle = this.color
      ctx.lineWidth = 3
      ctx.strokeRect(this.left, this.top, this.w + 1, this.h + 1)
    }

    if (this.sprite) {
      // Draw the sprite image (if there is one).
      let pos = [0, 0] // Animate for later
      ctx,drawImage(this.sprite,
        pos[0], pos[1], w, h,
        this.x, this.y, w, h
      );
    }
  }

  // Are we currently intersecting any solid Tiles?
  collides(shouldReturnTiles: boolean = false): any {
    let tileLeft   = Math.floor(this.left   / Tile.size)
    let tileRight  = Math.floor(this.right  / Tile.size)
    let tileTop    = Math.floor(this.top    / Tile.size)
    let tileBottom = Math.floor(this.bottom / Tile.size)

    let tiles = []
    let collision = false
    for (let x = tileLeft; x <= tileRight; x++) {
      for (let y = tileTop; y <= tileBottom; y++) {
        let tile = this.game.level.tileAt([x, y])

        if (tile.solid) {
          collision = true
        }

        tiles.push(tile)
      }
    }

    return shouldReturnTiles ? tiles : collision
  }

  // Whether or not the entity is on the ground or not.
  get grounded(): boolean {
    // Check if either the tile below the player to the LEFT or the tile below
    // the player to the RIGHT is solid.
    return (
      this.game.level.tileAt([Math.floor(this.x / 16), this.bottom / 16 + 0.1]).solid ||
      this.game.level.tileAt([Math.ceil(this.x / 16), this.bottom / 16 + 0.1]).solid
    )
  }
}

export class Player extends Entity {
  jumpSound: window.Audio

  constructor(game: SLW, x: number = 0, y:number = 0) {
    super(game)

    this.x = x
    this.y = y

    this.w = 16
    this.h = 24

    this.jumpSound = new window.Audio('sound/smw_jump.wav')
  }

  update() {
    // input:
    if (this.game.keys[39]) {
      this.xv += 1
    }

    if (this.game.keys[37]) {
      // xv
      this.xv -= 1
    }

    if (!this.game.keys[39] && !this.game.keys[37]) {
      // slow down
      this.xv += sign(this.xv) * -0.5
    }

    if (this.grounded && this.game.keys[32]) {
      // jump
      this.yv = -4.5
      this.jumpSound.play()
    }

    this.xv = Math.min(this.xv,  3)
    this.xv = Math.max(this.xv, -3)
    this.yv = Math.min(this.yv,  4)

    this.yv += GRAVITY

    // actually move:
    super.update()
  }
}

export class Goomba extends Entity {
  constructor(game: SLW, x: number = 0, y:number = 0) {
    super(game)

    this.x = x
    this.y = y

    this.w = 16
    this.h = 16

    this.xv = 1
  }

  update() {
    // TODO goombas walk and then turn around when they bump into something

    this.yv += GRAVITY

    // actually move:
    super.update()
  }
}
