// @flow

const DEBUG = true // show bounding boxes
const GRAVITY = 0.25

import SLW from './SLW'
import Tile from './Tile'

import { sign } from './util'

type Position = [number, number]

// is [z], [space], or [up arrow] down?
function isJump(keys): boolean {
  return keys[32] || keys[38] || keys[90]
}

export class Entity {
  game: SLW

  // Position, absolute (not tileX/Y!)
  x: number
  y: number

  // order in which entity is rendered
  z: number

  // Velocity
  xv: number
  yv: number

  // Dimensions (used for bounding box)
  w: number // width
  h: number // height

  color: string // "rgba(r, g, b, a)"
  sprite: {
    sheet: Image,
    position: Position,
    positionType: ?string,
    width: number,
    height: number
  }

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

    this.sprite = {
      sheet: new Image(),
      position: [0, 0],
      positionType: '',
      width: 0,
      height: 0
    }

    this.x = 0
    this.y = 0
    this.z = 0

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
    const xv = Math.round(this.xv)
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

        // Air punch should only happen when the entity jumps.
        if (v === -1) {
          const tileAboveX = Math.round(this.left / Tile.size)
          const tileAboveY = this.top / Tile.size - 1
          const tileAbove = this.game.level.tileAt([tileAboveX, tileAboveY])

          tileAbove.onAirPunch()
        }
      }
    }

    for (let tile of this.collides(true)) {
      tile.onTouch(this)
    }

    for (let entity of this.entityCollides()) {
      entity.onTouch(this)
    }
  }

  draw() {
    const ctx = this.game.canvas.getContext('2d')
    if (!(ctx instanceof CanvasRenderingContext2D)) return

    if (DEBUG) {
      // Draw the bounding box (if in DEBUG mode).
      ctx.fillStyle = this.color
      ctx.fillRect(this.left, this.top, this.w + 1, this.h + 1)
    }

    // Draw the sprite image (if there is one).
    const sprite = this.sprite

    if (sprite) {
      let [x, y] = sprite.position || [0, 0]
      let w = sprite.width || this.w
      let h = sprite.height || this.h

      if (sprite.positionType !== 'absolute') {
        x *= w
        y *= h
      }

      ctx.drawImage(
        this.sprite.sheet,

        // Area on sheet to grab
        x, y, w, h,

        // Area on screen to draw
        this.left, this.top, w, h
      )
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

  // What entities are we touching?
  entityCollides(): Array <Entity> {
    const entities = []

    for (let entity of this.game.entities) {
      // Don't detect itself!
      if (entity === this) continue

      if (this.left <= entity.left && entity.left <= this.right &&
          this.top <= entity.top && entity.top <= this.bottom) {
        entities.push(entity)
      }
    }

    return entities
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

  // Called when another entity touches this entity.
  onTouch() {}
}

export class Player extends Entity {
  jumpSound: window.Audio
  lastJump: number
  mayJump: boolean

  spriteAnimation: {
    time: number,
    anim: string,
    oldAnim: string,
    nextFrame: number
  }

  constructor(game: SLW, x: number = 0, y:number = 0) {
    super(game)

    this.sprite.sheet.src = 'liam.png'
    this.sprite.position = [233, -3]
    this.sprite.positionType = 'absolute'
    this.sprite.width = 18
    this.sprite.height = 34
    this.spriteAnimation = {time: 0, anim: '', oldAnim: '', nextFrame: 0}

    this.x = x
    this.y = y

    this.w = 15
    this.h = 31

    this.jumpSound = new window.Audio('sound/smw_jump.wav')
  }

  update() {
    // input:

    if (Math.abs(this.xv) < 0.4) {
      if (this.spriteAnimation.anim === 'walk-right') {
        this.spriteAnimation.anim = 'idle-right'
      } else if (this.spriteAnimation.anim === 'walk-left') {
        this.spriteAnimation.anim = 'idle-left'
      }
    }

    if (this.game.keys[39]) {
      this.xv += 0.1
      this.spriteAnimation.anim = 'walk-right'
    } else if(this.xv > 0) {
      this.xv = Math.max(0, this.xv - 0.2)
    }

    if (this.game.keys[37]) {
      // xv
      this.xv -= 0.1
      this.spriteAnimation.anim = 'walk-left'
    } else if(this.xv < 0) {
      this.xv = Math.min(0, this.xv + 0.2)
    }

    if (Math.abs(this.xv) < 0.1) {
      this.xv = 0
    }

    this.xv = Math.min(this.xv,  4)
    this.xv = Math.max(this.xv, -4)

    if (this.grounded && isJump(this.game.keys) && this.mayJump) {
      // jump height is based on a) how long you hold the key and b) your xv
      this.yv = -3 + Math.abs(this.xv) * -0.5
      this.lastJump = Date.now()

      this.jumpSound.play()
      this.mayJump = false
    } else if(isJump(this.game.keys) && Date.now() - this.lastJump < 100) {
      this.yv = -3 + Math.abs(this.xv) * -0.5
    } else if(!isJump(this.game.keys)) {
      // we may jump next frame
      this.mayJump = true
    }

    this.yv = Math.min(this.yv,  4)
    this.yv += GRAVITY

    // actually move:
    super.update()
  }

  draw() {
    // Animation..
    const anim = this.spriteAnimation
    if (anim.anim !== anim.oldAnim) {
      anim.oldAnim = anim.anim
      anim.time = 0
      anim.nextFrame = 0
    }

    if (anim.anim === 'walk-right' || anim.anim === 'walk-left') {
      if (anim.time >= anim.nextFrame) {
        anim.nextFrame = (
          Math.ceil(anim.time + Math.min(40 - Math.abs(this.xv * 3), 10))
        )

        if (anim.anim === 'walk-right') {
          if (this.sprite.position[0] === 292) {
            this.sprite.position = [264, -3]
          } else {
            this.sprite.position = [292, -3]
          }
        } else if (anim.anim === 'walk-left') {
          if (this.sprite.position[0] === 166) {
            this.sprite.position = [137, -3]
          } else {
            this.sprite.position = [166, -3]
          }
        }
      }
    }

    if (anim.anim === 'idle-left') {
      this.sprite.position = [197, -3]
    } else if (anim.anim === 'idle-right') {
      this.sprite.position = [233, -3]
    }

    this.spriteAnimation.time++

    super.draw()
  }
}

export class Goomba extends Entity {
  constructor(game: SLW, x: number = 0, y: number = 0) {
    super(game)

    this.x = x
    this.y = y
    this.z = 1

    this.w = 16
    this.h = 16

    this.xv = 1
  }

  update() {
    // TODO goombas walk and then turn around when they bump into something

    this.yv += GRAVITY
    super.update()
  }
}

export class Powerup extends Entity {
  constructor(game: SLW, x: number = 0, y: number = 0, xv: number = 1) {
    super(game)

    this.sprite.sheet.src = 'tileset.png'

    this.x = x
    this.y = y
    this.z = 2

    this.w = 16
    this.h = 16

    this.xv = xv
    this.sprite.position = [0, 0]
  }

  update() {
    this.yv += GRAVITY * 0.7
    super.update()
  }

  onTouch() {
    this.game.entities.splice(this.game.entities.indexOf(this), 1)

    // TODO Powerups
  }
}

export class Mushroom extends Powerup {
  constructor(...args: any) {
    super(...args)

    this.sprite.position = [0, 2]
  }
}

export class Sign extends Entity {
  constructor(game: SLW, x: number = 0, y: number = 0) {
    super(game)

    this.x = x
    this.y = y

    this.w = 44
    this.h = 45

    this.game.entities.push(this)

    this.sprite.sheet.src = 'tileset.png'
    this.sprite.positionType = 'absolute'
    this.sprite.position = [80, 32]
    this.sprite.width = 44
    this.sprite.height = 47
  }
}
