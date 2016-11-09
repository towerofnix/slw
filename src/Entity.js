// @flow

const DEBUG = false // lags lots but is helpful
const GRAVITY = 0.25

import SLW from './SLW'
import Tile from './Tile'
import Level from './Level'
import Text from './Text'

import { sign, levels } from './util'

import type { Position } from './types'

// is [z], [space], or [up arrow] down?
function isJump(keys): boolean {
  return keys[32] || keys[38] || keys[90]
}

// is [z], [space], or [enter] down?
function isYes(keys): boolean {
  return keys[32] || keys[13] || keys[90]
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
    this.color = `rgb(${c.r}, ${c.g}, ${c.b})`
  }

  update(stop: boolean = true) {
    let v: number = 0

    // x:
    const xv = Math.round(this.xv)
    v = sign(xv)

    for (let i = 0; i < Math.abs(xv); i++) {
      this.x += v
      if (this.touchingWallRight || this.touchingWallLeft) {
        this.x -= v
        if (stop) this.xv = 0
      }
    }

    // y:
    const yv = Math.floor(this.yv)
    v = sign(yv)

    for (let i = 0; i < Math.abs(yv); i++) {
      this.y += v

      // Checking if grounded should only happen if the entity is going down
      // (that way it can jump through solidTop blocks)
      if ((v === 1 && this.grounded) || this.collides()) {
        this.y -= v
        if (stop) this.yv = 0

        this.y = Math.ceil(this.y / Tile.size) * Tile.size

        // Air punch should only happen when the entity jumps.
        if (v === -1) {
          for (let tile of this.tilesAbove) {
            tile.onAirPunch(this)
          }
        }
      }
    }

    if ((this.y >= this.game.level.h * Tile.size) && !this.game.level.meta.special.includes('world'))
      return this.destroy()

    for (let tile of this.pickTiles(0, 0, 0, 1)) {
      tile.onTouch(this)
    }

    for (let tile of this.tilesBelow) {
      tile.onStand(this)
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

      ctx.drawImage(Text.write(this.constructor.name, this.color), this.right, this.bottom)
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

  get touchingWallRight(): boolean {
    let tileLeft   = Math.floor(this.right  / Tile.size)
    let tileRight  = tileLeft
    let tileTop    = Math.floor(this.top    / Tile.size)
    let tileBottom = Math.floor(this.bottom / Tile.size)

    // Weird bug.. dunno why this (helps) fix #19 though. I can't imagine
    // tileBottom is broken! (Right?)
    // TODO Figure this out. Right now it's a plain fix for height=16
    if (this.h === 16) {
      tileBottom--
    }

    for (let x = tileLeft; x <= tileRight; x++) {
      for (let y = tileTop; y <= tileBottom; y++) {
        const tile = this.game.level.tileAt([x, y])

        if (tile.solid) {
          return true
        }
      }
    }

    return false
  }

  get touchingWallLeft(): boolean {
    let tileLeft   = Math.floor(this.left   / Tile.size)
    let tileRight  = tileLeft
    let tileTop    = Math.floor(this.top    / Tile.size)
    let tileBottom = Math.floor(this.bottom / Tile.size)

    // Same deal as touchingWallRight
    if (this.h === 16) {
      tileBottom--
    }

    for (let x = tileLeft; x <= tileRight; x++) {
      for (let y = tileTop; y <= tileBottom; y++) {
        const tile = this.game.level.tileAt([x, y])

        if (tile.solid) {
          return true
        }
      }
    }

    return false
  }

  // Handy function to pick tiles around the entity.
  // TODO is this broken? Do tests!
  pickTiles(
    tileLeft: number, tileRight: number, tileTop: number, tileBottom: number
  ): Array <Tile> {
    const tiles = []

    for (let px = Math.floor(tileLeft); px <= Math.ceil(tileRight); px++) {
      for (let py = Math.floor(tileTop); py <= Math.ceil(tileBottom); py++) {
        tiles.push(this.game.level.tileAt([
          tileLeft + px + this.x / Tile.size, tileTop + py + this.y / Tile.size
        ]))
      }
    }

    return tiles
  }

  // Handy function to destroy the entity.
  destroy() {
    this.game.entities.splice(this.game.entities.indexOf(this), 1)
  }

  // What entities are we touching?
  entityCollides(): Array <Entity> {
    const entities = []

    for (let entity of this.game.entities) {
      // Don't detect itself!
      if (entity === this) continue

      if (
        (
          this.left <= entity.left && entity.left <= this.right ||
          this.left <= entity.right && entity.right <= this.right
        ) && (
          this.top <= entity.top && entity.top <= this.bottom ||
          this.top <= entity.bottom && entity.bottom <= this.bottom
        )
      ) {
        entities.push(entity)
      }
    }

    return entities
  }

  // Get the single tile at the centre of the entity.
  get tileOn(): Tile {
    let t = this.game.level.tileAt([
      Math.floor((this.x + this.w / 2) / 16),
      Math.floor((this.y + this.h / 2) / 16)
    ])

    return t
  }

  // Get the two (potentially same) tiles ABOVE the entity.
  get tilesAbove(): [Tile, Tile] {
    let l = this.game.level.tileAt([Math.floor(this.x / 16), this.top / 16 - 0.1])
    let r = this.game.level.tileAt([Math.ceil(this.x / 16), this.top / 16 - 0.1])

    return [l, r]
  }

  // Get the two (potentially same) tiles BELOW the entity.
  get tilesBelow(): [Tile, Tile] {
    let l = this.game.level.tileAt([Math.floor(this.x / 16), this.bottom / 16 + 0.1])
    let r = this.game.level.tileAt([Math.ceil(this.x / 16), this.bottom / 16 + 0.1])

    return [l, r]
  }

  // Whether or not the entity is on the ground or not.
  get grounded(): boolean {
    /*
    return this.pickTiles(0, 0, 1, 1).some(x => x.solid || x.solidTop)
    */

    return this.tilesBelow.some(tile => tile.solid || tile.solidTop)
  }

  // Called when another entity touches this entity.
  onTouch(by: Entity) {}
}

export class Player extends Entity {
  jumpSound: window.Audio
  errorSound: window.Audio
  startLevelSound: window.Audio
  moveLevelSound: window.Audio

  lastJump: number
  mayJump: boolean

  spriteAnimation: {
    time: number,
    anim: string,
    dir: string,
    oldAnim: string,
    nextFrame: number,
  }

  state: number // powerup state

  lastOn: ?Tile // world map only.
  wantsInput: ?boolean // world map only.

  constructor(game: SLW, x: number = 0, y:number = 0) {
    super(game)

    this.sprite.sheet.src = 'sprites/liam-0.png'
    this.sprite.position = [-100, -100]
    this.sprite.positionType = 'absolute'
    this.sprite.width = 19
    this.sprite.height = 32
    this.spriteAnimation = { time: 0, dir: 'right', anim: 'idle', oldAnim: '', nextFrame: 0 }

    this.x = x
    this.y = y

    this.w = 15
    this.h = 15
    this.state = 0

    this.jumpSound = new window.Audio('sound/smw_jump.wav')
    this.errorSound = new window.Audio('sound/smw_stomp_koopa_kid.wav')
    this.startLevelSound = new window.Audio('sound/begin_level.wav')
    this.moveLevelSound = new window.Audio('sound/move_level.wav')
  }

  update() {
    if (this.game.level.editorEnabled) {
      // Camera is scrolled directly in editor mode
      this.xv = 0
      this.yv = 0
      return
    }

    this.sprite.sheet.src = `sprites/liam-${this.state}.png`
    if (this.state > 0) {
      // big/powerupped
      this.w = 15
      this.h = 31
      this.sprite.width = 19
      this.sprite.height = 32
      this.sprite.positionType = 'absolute'
    } else {
      // small
      this.w = 15
      this.h = 15
      this.sprite.width = 16
      this.sprite.height = 16
    }

    if (this.game.level.meta.special.includes('world')) {
      this.mapMotion()
    } else {
      this.levelMotion()
    }

    // actually move:
    super.update(this.wantsInput == true || !this.game.level.meta.special.includes('world'))

    if (this.xv !== 0 || this.yv !== 0) this.wantsInput = false
  }

  mapMotion() {
    // overworld/map..
    const walkSpeed = 4

    // small hitbox allows for greater movement
    // TODO
    this.w = 15
    this.h = 15

    // A different version of tileOn. This one only counts a new tile if you're
    // actually 100% on it - that is, if tileX and tileY are integers.
    let on: ?Tile
    const tileX = this.left / Tile.size
    const tileY = this.top / Tile.size
    if (Number.isInteger(tileX) && Number.isInteger(tileY)) {
      on = this.game.level.tileAt([tileX, tileY])
    } else {
      on = this.lastOn
    }

    // Initial
    if (!this.lastOn) {
      this.wantsInput = true
    }

    // Levels, houses and pipes should let the user take input. If it's the
    // same tile as the player was just on a tick ago, there's no need to give
    // more input - if it does, the actual user needs to hold down whatever
    // direcitonal button they're moving in until the player gets off that
    // tile!
    if (on &&
      ['Level', 'House', 'Pipe'].includes(on.name) && on !== this.lastOn
    ) {
      this.wantsInput = true
    }

    if (on && on.name === 'Path' && !this.wantsInput) {
      // we're already moving!

      this.spriteAnimation.anim = 'walk'
      if (this.xv > 0) this.spriteAnimation.dir = 'right'
      if (this.xv < 0) this.spriteAnimation.dir = 'left'
      if (this.yv > 0) this.spriteAnimation.dir = 'down'
      if (this.yv < 0) this.spriteAnimation.dir = 'up'

      // we need to be on a NEW tile to do anything:
      if (!this.lastOn || on.texPosition !== this.lastOn.texPosition) {
        const [h, v] = on.texPosition

        if (h == 2 && v == 8) {
          // vertical straight
        }

        if (h == 1 && v == 9) {
          // horizontal straight
        }

        if (h == 3 && v == 9) {
          // up/left turn

          if (this.yv === 0) {
            // from left
            this.xv = 0
            this.yv = -walkSpeed
          } else {
            // from up
            this.xv = -walkSpeed
            this.yv = 0
          }
        }

        if (h == 3 && v == 8) {
          // down/right turn

          if (this.yv === 0) {
            // from right
            this.xv = 0
            this.yv = walkSpeed
          } else {
            // from down
            this.xv = walkSpeed
            this.yv = 0
          }
        }

        if (h == 1 && v == 8) {
          // up/right turn

          if (this.yv === 0) {
            // from right
            this.xv = 0
            this.yv = -walkSpeed
          } else {
            // from up
            this.xv = walkSpeed
            this.yv = 0
          }
        }

        if (h == 1 && v == 10) {
          // down/left turn

          if (this.yv === 0) {
            // from left
            this.xv = 0
            this.yv = walkSpeed
          } else {
            // from down
            this.xv = -walkSpeed
            this.yv = 0
          }
        }

        if (h == 2 && v == 10) {
          // up/down T-junction
          this.xv = 0
          this.yv = 0
          this.wantsInput = true
        }
      }
    } else if (this.wantsInput) {
      this.xv = 0
      this.yv = 0

      // take input..
      // TODO don't allow passing by [3, 10] tiles (uncompleted levels)
      this.spriteAnimation.anim = 'idle'

      if (this.game.keys[39]) {
        this.xv = walkSpeed
        this.spriteAnimation.dir = 'right'
      } else if (this.xv > 0) {
        this.xv = 0
      }

      if (this.game.keys[37]) {
        this.xv = -walkSpeed
        this.spriteAnimation.dir = 'left'
      } else if (this.xv < 0) {
        this.xv = 0
      }

      if (this.game.keys[40]) {
        this.yv = walkSpeed
        this.spriteAnimation.dir = 'down'
      } else if (this.yv > 0) {
        this.yv = 0
      }

      if (this.game.keys[38]) {
        this.yv = -walkSpeed
        this.spriteAnimation.dir = 'up'
      } else if (this.yv < 0) {
        this.yv = 0
      }

      if (on && on.name === 'Level' && isYes(this.game.keys)) {
        // open level!
        // TODO some animation?

        const lv = this.game.level.meta.id + '-' + on.levelid

        if (lv in levels) {
          this.w = 15
          this.h = 31

          const newLevel = new Level(this.game, lv, this.game.level.tileset)
          this.game.changeLevel(newLevel)

          this.game.tick = 0
          this.startLevelSound.play()
        } else {
          this.errorSound.play()
        }
      }

      if (this.xv !== 0 || this.yv !== 0) {
        // we moved :O
        this.moveLevelSound.play()
      }
    }

    this.lastOn = on
  }

  levelMotion() {
    // input:

    if (Math.abs(this.xv) < 0.2 && this.grounded) {
      this.spriteAnimation.anim = 'idle'
    }

    if (this.game.keys[39]) {
      this.xv += 0.2
      if (this.grounded) this.spriteAnimation.anim = 'walk'
    } else if(this.xv > 0) {
      this.xv = Math.max(0, this.xv - 0.4)
    }

    if (this.game.keys[37]) {
      // xv
      this.xv -= 0.2
      if (this.grounded) this.spriteAnimation.anim = 'walk'
    } else if(this.xv < 0) {
      this.xv = Math.min(0, this.xv + 0.4)
    }

    if (Math.abs(this.xv) < 0.1) {
      this.xv = 0
    }

    this.xv = Math.min(this.xv,  4)
    this.xv = Math.max(this.xv, -4)

    if (this.grounded && isJump(this.game.keys) && this.mayJump) {
      // jump height is based on how long you hold the key[s]
      // you can hold it for longer if your xv is higher

      this.yv = -3.5
      this.lastJump = Date.now()

      this.jumpSound.play()
      this.spriteAnimation.anim = 'jump'
      this.mayJump = false
    } else if(isJump(this.game.keys) && this.yv < -3 && Date.now() - this.lastJump < 100 + Math.abs(this.xv) * 50) {
      this.yv = -3.5
    } else if(!isJump(this.game.keys)) {
      // we may jump next frame
      this.mayJump = true
    }

    if(this.yv > 0 && this.spriteAnimation.anim !== 'jump' && !this.grounded) {
      this.spriteAnimation.anim = 'fall'
    }

    if(this.xv > 0) this.spriteAnimation.dir = 'right'
    if(this.xv < 0) this.spriteAnimation.dir = 'left'

    this.yv = Math.min(this.yv,  4)
    this.yv += GRAVITY
  }

  draw() {
    // Animation..
    const anim = this.spriteAnimation
    if (anim.anim !== anim.oldAnim) {
      anim.oldAnim = anim.anim
      anim.time = 0
      anim.nextFrame = 0
    }

    if (anim.anim === 'walk' || (anim.anim === 'idle' && anim.oldAnim === 'walk')) {
      if (anim.time >= anim.nextFrame) {
        anim.nextFrame = (
          Math.ceil(anim.time + Math.max(12 - Math.abs(this.xv * 3), 8))
        )

        if (this.state === 0) {
          if (this.sprite.position[0] === 32) {
            this.sprite.position[0] = 0
          } else if (this.sprite.position[0] === 16) {
            this.sprite.position[0] = 32
          } else if (this.sprite.position[0] === 0) {
            if(anim.anim === 'walk') this.sprite.position[0] = 16
          } else {
            this.sprite.position[0] = 0
          }
        } else {
          if (this.sprite.position[0] === 57) {
            this.sprite.position[0] = 0
          } else if (this.sprite.position[0] === 38) {
            this.sprite.position[0] = 57
          } else if (this.sprite.position[0] === 19) {
            if(anim.anim === 'walk') this.sprite.position[0] = 38
          } else {
            this.sprite.position[0] = 19
          }
        }
      }
    } else if (anim.anim === 'idle') {
      this.sprite.position[0] = this.state === 0 ? 0 : 19
    } else if (anim.anim === 'jump') {
      this.sprite.position[0] = this.state === 0 ? 48 : 76
    } else if (anim.anim === 'fall') {
      this.sprite.position[0] = this.state === 0 ? 32 : 97
    }

    this.sprite.position[1] = this.state === 0 ? ({
      left: 16,
      right: 0,
      up: 48,
      down: 32,
    })[anim.dir] : (anim.dir === 'left' ? 32 : 0)
    this.spriteAnimation.time++ // could use this.game.tick

    super.draw()
  }

  destroy() {
    // go back to world map:

    const lv = this.game.level.meta.world
    const id = this.game.level.meta.id

    const newLevel = new Level(this.game, lv, this.game.level.tileset)
    this.game.changeLevel(newLevel)

    this.state = 0

    // On the world map, go to the position of the level that was just played.
    for (let row of this.game.level.tilemap) {
      for (let tile of row) {
        if (tile.name === 'Level' && tile.levelid == id) {
          this.x = tile.x * Tile.size
          this.y = tile.y * Tile.size
        }
      }
    }
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

    this.xv = 2
  }

  update() {
    // TODO goombas walk and then turn around when they bump into something

    this.yv += GRAVITY
    super.update()
  }
}

export class Powerup extends Entity {
  getSound: window.Audio
  initSound: window.Audio

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

    this.getSound = new window.Audio('sound/powerup_get.wav')
    this.initSound = new window.Audio('sound/powerup_init.wav')

    this.initSound.play()
  }

  update() {
    this.yv += GRAVITY * 0.7

    let o = this.xv

    this.x += this.xv
    if (this.touchingWallRight || this.touchingWallLeft) o = this.xv * -1
    this.x -= this.xv

    this.xv = o

    super.update()
  }

  onTouch(by: Entity) {
    if (by instanceof Player) {
      this.destroy()
      this.getSound.play()
    }
  }
}

export class Mushroom extends Powerup {
  constructor(...args: any) {
    super(...args)

    this.sprite.position = [0, 2]
  }

  onTouch(by: Entity) {
    if (by instanceof Player && by.state === 0) {
      by.state = 1 // small to big
      by.y -= Tile.size
    }

    super.onTouch(by)
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

export class Coin extends Entity {
  coinSound: window.Audio

  spriteAnimation: {
    time: number,
    nextFrame: number
  }

  constructor(game: SLW, x: number = 0, y: number = 0) {
    super(game)

    this.x = x
    this.y = y

    this.w = 16
    this.h = 16

    this.sprite.sheet.src = 'sprites/coin.png'
    this.sprite.width = 16
    this.sprite.height = 16

    this.spriteAnimation = {time: 0, nextFrame: 0}

    this.coinSound = new window.Audio('sound/smw_coin.wav')
  }

  update() {
    const anim = this.spriteAnimation

    if (anim.time >= anim.nextFrame) {
      anim.nextFrame = anim.time + 10
      this.sprite.position[0] = (this.sprite.position[0] + 1) % 4
    }

    anim.time++
  }

  onTouch(by: Entity) {
    if(by instanceof Player) {
      this.coinSound.play()
      this.destroy()
    }
  }
}

export class HalfwayFlag extends Entity {
  spriteAnimation: {
    time: number,
    nextFrame: number,
    frame: number,
  }

  state: number // 0 = bowser, 1 = liam

  constructor(game: SLW, x: number = 0, y: number = 0) {
    super(game)

    this.x = x
    this.y = y - 16

    this.w = 16
    this.h = 16 + 17

    this.state = 0
    this.game.entities.push(this)

    this.sprite.sheet.src = 'sprites/flag.png'
    this.sprite.width = 16
    this.sprite.height = 16
    this.sprite.positionType = 'absolute'

    this.spriteAnimation = { time: 0, nextFrame: 0, frame: 0 }
  }

  update() {
    const anim = this.spriteAnimation

    if (anim.time >= anim.nextFrame) {
      anim.nextFrame = anim.time + 10
      anim.frame = (anim.frame + 1) % 4
    }

    anim.time++

    this.sprite.position[0] = ([ 18, 35, 52, 69 ])[anim.frame]
    this.sprite.position[1] = ([ 1, 35 ])[this.state]
  }

  draw() {
    const ctx = this.game.canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(this.sprite.sheet,
      // Area on sheet to grab
      1, 1, 16, 48,

      // Area on screen to draw
      this.left - 10, this.top - 16, 16, 48)
    super.draw()
  }

  onTouch(by: Entity) {
    if(by instanceof Player) {
      // TODO play a sound and an animation
      this.state = 1
    }
  }
}
