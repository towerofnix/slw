// @flow

// SUPER LIAM WORLD(tm)
// totally not stolen from an-ok-squirrel.
// this is a fair use of the name as specified
// in NANALAND RULES NUMBER #99

type Position = [number, number]

import Tile from './Tile'
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

  // Level, to contain information about the currently active level.
  level: Level

  // Amount of draw()s called since we started.
  tick: number

  entities: Array <Entity>

  constructor(levelid: string, tileset: Image) {
    this.keys = {}
    this.entities = []

    this.canvas = document.createElement('canvas')
    this.canvas.width = 20 * 20
    this.canvas.height = 20 * 20

    this.canvas.addEventListener('keydown', (evt: KeyboardEvent) => {
      this.keys[evt.keyCode] = true
    })

    this.canvas.addEventListener('keyup', (evt: KeyboardEvent) => {
      this.keys[evt.keyCode] = false
    })

    this.canvas.setAttribute('tabindex', '1')

    this.player = new Player(this, 16, 16)
    this.camera = [0, 0]
    this.level = new Level(this, levelid, tileset)
    this.tick = 0

    // Call create() on the Level Tiles
    for (let row of this.level.tilemap) {
      for (let tile of row) {
        tile.onCreate()
      }
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

    // TODO GUI

    this.tick++
  }
}
