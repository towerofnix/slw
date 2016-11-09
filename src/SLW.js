// @flow

// SUPER LIAM WORLD(tm)
// totally not stolen from an-ok-squirrel.
// this is a fair use of the name as specified
// in NANALAND RULES NUMBER #99

import Tile from './Tile'
import Text from './Text'
import Level from './Level'
import Cursor from './Cursor'
import SoundManager from './SoundManager'
import { Entity, Player } from './Entity'

import {
  arrEqual, EventController,
  isLeft, isRight, isUp, isDown
} from './util'

import type { Position } from './types'

const BG_COLORS = {
  clouds: '#A0D0F8',
  hills: '#F8E0B0',
}

const BG_REPEATS = {
  clouds: 'repeat-x',
  hills: 'repeat-y',
}

export default class SLW {
  // Event controller.
  events: EventController

  // Sound system.
  sounds: SoundManager

  // Map to store key-pressed data in.
  keys: Object

  // Keys that were pressed this tick.
  newKeys: Object

  // Canvas used to display the game on.
  canvas: HTMLCanvasElement

  // Player object - the character that walks around the screen using the
  // user's input as controls.
  player: Player

  // Camera position. Used for scrolling.
  camera: Position
  cameraInEditor: Position

  // Tile that will be painted, for level editor.
  tileToPaint: any

  // Cursor object - see Cursor.js.
  cursor: Cursor

  // Stored separately from the cursor object because the cursor doesn't have
  // any notion of "ticks".
  lastPlacePos: Position

  // Level, to contain information about the currently active level.
  level: Level

  // Amount of draw()s called since we started.
  tick: number

  gamepadSupport: boolean
  gamepadEnabled: boolean

  entities: Array <Entity>

  constructor(levelid: string, tileset: Image) {
    this.events = new EventController()
    this.events.registerEvent('levelchanged')

    this.sounds = new SoundManager()

    this.keys = {}
    this.newKeys = {}

    this.canvas = document.createElement('canvas')
    this.canvas.width = 400
    this.canvas.height = 400
    this.canvas.setAttribute('tabindex', '1')

    window.addEventListener('keydown', (evt: KeyboardEvent) => {
      this.keys[evt.keyCode || evt.which] = true
      this.newKeys[evt.keyCode || evt.which] = true
    })

    window.addEventListener('keyup', (evt: KeyboardEvent) => {
      this.keys[evt.keyCode || evt.which] = false
    })

    this.player = new Player(this, 16, 16)

    this.camera = [0, 0]
    this.cameraInEditor = [0, 0]

    this.cursor = new Cursor([0.5, 0.5])
    this.cursor.watchMouse(this.canvas)

    this.lastPlacePos = [0, 0]

    this.entities = []

    this.changeLevel(new Level(this, levelid, tileset))

    this.gamepadSupport = (
      'GamepadEvent' in window || 'getGamepads' in navigator
    )
    this.gamepadEnabled = false
  }

  // Clears the game canvas.
  canvasClear() {
    const ctx = this.canvas.getContext('2d')

    if (ctx instanceof CanvasRenderingContext2D) {
      ctx.fillStyle = BG_COLORS[this.level.meta.background] || 'black'
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }
  }

  // Do gamepad things.
  gamepadInput() {
    try {
      if (this.gamepadSupport && this.gamepadEnabled) {
        const gamepads = window.navigator.getGamepads()

        if (gamepads.length > 0) {
          let newest = gamepads[0]
          for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i]

            if (gamepad.connected) {
              // we want the latest timestamped gamepad
              if (newest.timestamp < gamepad.timestamp) newest = gamepad
            }
          }

          // set the keys
          const pad = newest

          this.keys[90] = pad.buttons[1].pressed // z
          this.keys[80] = pad.buttons[2].pressed // x
          this.keys[37] = pad.axes[0] < -0.5     // <
          this.keys[39] = pad.axes[0] >  0.5     // >
          this.keys[38] = pad.axes[1] < -0.5     // ^
          this.keys[40] = pad.axes[1] >  0.5     // v
        }
      }
    } catch(e) {
      // There's probably gonna be errors thrown around in lots of browsers.
      // Don't them crash the game.
      console.warn(e)
    }
  }

  // Modify the camera position to reflect where the player is.
  // Essentially, this is just scrolling.
  cameraUpdate() {
    let minY = Tile.size + this.canvas.height / 2
    let maxY = (this.level.h - 1) * Tile.size - this.canvas.height / 2
    let minX = Tile.size + this.canvas.width / 2
    let maxX = (this.level.w - 1) * Tile.size - this.canvas.width / 2

    if (this.level.editorEnabled) {
      const CAM_SPD = 4
      if (isUp(this.keys)) this.cameraInEditor[1] -= CAM_SPD
      if (isDown(this.keys)) this.cameraInEditor[1] += CAM_SPD
      if (isLeft(this.keys)) this.cameraInEditor[0] -= CAM_SPD
      if (isRight(this.keys)) this.cameraInEditor[0] += CAM_SPD

      this.cameraInEditor[0] = Math.min(
        maxX,
        Math.max(minX, this.cameraInEditor[0])
      )

      this.cameraInEditor[1] = Math.min(
        maxY,
        Math.max(minY, this.cameraInEditor[1])
      )
    }

    let x = this.level.editorEnabled ? this.cameraInEditor[0] : this.player.x
    let y = this.level.editorEnabled ? this.cameraInEditor[1] : this.player.y

    if(y < minY) y = minY
    if (y > maxY) y = maxY
    if (x < minX) x = minX
    if (x > maxX) x = maxX

    if (this.level.meta.special.includes('floating')) {
      // airship-like level, wave the camera y
      let wave = Math.sin(this.tick / 40) * Tile.size / 2
      y += wave
    }

    let lag = this.tick > 0 ? 8 : 1
    this.camera[0] += (x - this.canvas.width / 2 - this.camera[0]) / lag
    this.camera[1] += (y - this.canvas.height / 2 - this.camera[1]) / lag
  }

  // Update all the entities.
  entityUpdate() {
    this.entities.forEach(e => e.update())
  }

  changeLevel(newLevel: Level) {
    const oldLevel = this.level

    if (oldLevel) {
      oldLevel.destroy()
    }

    this.tick = 0
    this.level = newLevel
    newLevel.create()

    this.events.dispatchEvent('levelchanged', {
      oldLevel: oldLevel || null, level: newLevel
    })
  }

  // Draw all the things.
  draw() {
    const ctx = this.canvas.getContext('2d')
    if (!(ctx instanceof CanvasRenderingContext2D)) return

    let tx = -0.25 * this.camera[0]
    let ty = -0.25 * this.camera[1]
    if (this.level.meta.special.includes('floating')) tx += -0.25 * this.tick

    ctx.save()
    ctx.translate(tx, ty)

    if(this.level.meta.background === 'none') {
      var ptrn = 'black'
    } else {
      let bg = new Image
      bg.src = `background/${this.level.meta.background}.png`
      var ptrn = ctx.createPattern(bg, BG_REPEATS[this.level.meta.background] || 'repeat')
    }

    ctx.fillStyle = ptrn
    ctx.fillRect(-tx, -ty, this.canvas.width, this.canvas.height)

    ctx.restore()

    // scroll
    ctx.save()
    ctx.translate(Math.floor(-this.camera[0]), Math.floor(-this.camera[1]))

    const entities = this.entities.sort((a, b) => {
      if(a.z > b.z) return 1
      if(a.z < b.z) return -1
      return 0
    })
    entities.filter(e => e.z < 0).forEach(e => e.draw())
    this.level.draw()
    entities.filter(e => e.z >= 0).forEach(e => e.draw())
    this.player.draw()

    /*
    ctx.fillStyle = 'red'
    ctx.fillRect(Tile.size, (this.level.h - 1) * Tile.size, (this.level.w - 2) * Tile.size, 1)
    ctx.fillRect(Tile.size, Tile.size, 1, (this.level.h - 2) * Tile.size)
    ctx.fillRect((this.level.w - 1) * Tile.size, Tile.size, 1, (this.level.h - 2) * Tile.size)
    */

    // unscroll
    ctx.restore()

    // GUI:

    if (this.level.meta.special.includes('world')) {
      let on = this.player.tileOn
      let str = this.level.meta.name

      if (on.name === 'Level') {
        let level = Level.metaOf(this.level.meta.id + '-' + on.levelid)

        if (level) {
          str += ' . ' + (on.levelid || 0)  + ' ' + level.name
        } else {
          str += ' . Level doesn\'t exist rip'
        }
      }

      ctx.drawImage(Text.write(str), 16, 16)
    }

    ctx.drawImage(Text.write(`
Cursor XY   ${this.cursor.pos.map(p => Math.floor(p)).join(' ')}
Cursor Down ${this.cursor.down.toString()}
Player XY   ${this.player.x + ' ' + this.player.y}
Camera XY   ${this.camera.map(p => Math.floor(p)).join(' ')}
    `, 'rgba(0, 0, 0, 0.5)'), 16, 32)

    if (this.level.editorEnabled) {
      // Various cursor transforms to snap to a tile:

      // Start with the actual position of the cursor.
      let [cursorX, cursorY] = this.cursor.pos

      // Snap the position to a tile size. This is rounded so that grabbing tiles
      // on the edge of the screen works better, and it also helps the cursor's
      // rendered position follow the cursor's actual position a bit better.
      let roundTileX = cursorX % Tile.size
      if (roundTileX < Tile.size / 2) cursorX -= roundTileX
      else cursorX += Tile.size - roundTileX

      let roundTileY = cursorY % Tile.size
      if (roundTileY < Tile.size / 2) cursorY -= roundTileY
      else cursorY += Tile.size - roundTileY

      // At ths point we can go on a slight tangent to get the absolute tile
      // position of the cursor.
      let cursorTileX = cursorX / Tile.size
      let cursorTileY = cursorY / Tile.size
      cursorTileX += Math.floor(this.camera[0] / Tile.size)
      cursorTileY += Math.floor(this.camera[1] / Tile.size)

      // Move the cursor so that it aligns with the camera's position.
      cursorX -= this.camera[0] % Tile.size
      cursorY -= this.camera[1] % Tile.size

      // Center the cursor on the tile.
      cursorX += Tile.size / 2
      cursorY += Tile.size / 2

      // Finally draw the cursor.
      this.cursor.drawUsingCtx(ctx, cursorX, cursorY)

      const tilePos: Position = [cursorTileX, cursorTileY]

      if (this.cursor.down && !arrEqual(this.lastPlacePos, tilePos)) {
        const tile = new (this.tileToPaint)(this)
        this.level.replaceTile([cursorTileX, cursorTileY], tile)
        this.lastPlacePos = tilePos
      }
    }

    this.newKeys = {}
    this.tick++
  }
}
