// @flow

// SUPER LIAM WORLD(tm)
// totally not stolen from an-ok-squirrel.
// this is a fair use of the name as specified
// in NANALAND RULES NUMBER #99

type Position = [number, number]

import Tile from './Tile'
import Text from './Text'
import Level from './Level'
import { Entity, Player } from './Entity'

const BG_COLORS = {
  clouds: '#A0D0F8',
  hills: '#F8E0B0',
}

const BG_REPEATS = {
  clouds: 'repeat-x',
  hills: 'repeat-y',
}

export default class SLW {
  // Map to store key-pressed data in.
  keys: Object

  // Canvas used to display the game on.
  canvas: HTMLCanvasElement

  // Player object - the character that walks around the screen using the
  // user's input as controls.
  player: Player

  // Camera position. Used for scrolling.
  camera: Position

  // Cursor (mouse) position, relative to the canvas.
  cursor: Position

  // Level, to contain information about the currently active level.
  level: Level

  // Amount of draw()s called since we started.
  tick: number

  gamepadSupport: boolean
  gamepadEnabled: boolean

  entities: Array <Entity>

  constructor(levelid: string, tileset: Image) {
    this.keys = {}
    this.cursor = [0, 0]
    this.entities = []

    this.canvas = document.createElement('canvas')
    this.canvas.width = 20 * 20
    this.canvas.height = 20 * 20

    this.canvas.addEventListener('keydown', (evt: KeyboardEvent) => {
      this.keys[evt.keyCode || evt.which] = true
    })

    this.canvas.addEventListener('keyup', (evt: KeyboardEvent) => {
      this.keys[evt.keyCode || evt.which] = false
    })

    this.canvas.addEventListener('mousemove', (evt: MouseEvent) => {
      let rect = this.canvas.getBoundingClientRect()
      this.cursor = [evt.clientX - rect.left, evt.clientY - rect.top]
    })

    this.canvas.setAttribute('tabindex', '1')

    this.player = new Player(this, 16, 16)
    this.camera = [0, 0]
    this.level = new Level(this, levelid, tileset)
    this.tick = 0

    this.level.create()

    this.gamepadSupport = 'GamepadEvent' in window || 'getGamepads' in navigator
    this.gamepadEnabled = localStorage['gamepadEnabled'] == 'true'

    if (this.gamepadSupport) {
      let el = document.getElementById('gamepadEnabled')
      // @flow ignore
      el.disabled = false
      el.innerText = this.gamepadEnabled ? 'Gamepad is ON' : 'Gamepad is OFF'
      el.addEventListener('click', (evt: Event) => {
        this.gamepadEnabled = !this.gamepadEnabled
        localStorage['gamepadEnabled'] = this.gamepadEnabled.toString()
        el.innerText = this.gamepadEnabled ? 'Gamepad is ON' : 'Gamepad is OFF'
      })
    }
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
    let x = this.player.x
    let y = this.player.y

    let minY = Tile.size + this.canvas.height / 2
    let maxY = (this.level.h - 1) * Tile.size - this.canvas.height / 2
    let minX = Tile.size + this.canvas.width / 2
    let maxX = (this.level.w - 1) * Tile.size - this.canvas.width / 2

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

      ctx.drawImage(Text.write(str), 4, 4)
    }

    let cursor = new Image
    cursor.src = 'sprites/cursor.png'
    ctx.drawImage(cursor, Math.floor(this.cursor[0] / 16) * 16 - 4, Math.floor(this.cursor[1] / 16) * 16 - 4)

    this.tick++
  }
}
