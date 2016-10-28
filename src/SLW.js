// @flow

// SUPER LIAM WORLD(tm)
// totally not stolen from an-ok-squirrel.
// this is a fair use of the name as specified
// in NANALAND RULES NUMBER #99

type Position = [number, number]

import Tile from './Tile'
import Level from './Level'
import { Entity, Player } from './Entity'

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
      ctx.fillStyle = '#A0D0F8'
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
    if(y > maxY) y = maxY
    if(x < minX) x = minX
    if(x > maxX) x = maxX

    this.camera[0] += x - this.canvas.width / 2 - this.camera[0]
    this.camera[1] += y - this.canvas.height / 2 - this.camera[1]
  }

  // Update all the entities.
  entityUpdate() {
    this.entities.forEach(e => e.update())
  }

  // Draw all the things.
  draw() {
    const ctx = this.canvas.getContext('2d')
    if (!(ctx instanceof CanvasRenderingContext2D)) return

    // scroll
    ctx.translate(Math.floor(-this.camera[0]), Math.floor(-this.camera[1]))

    this.level.draw()
    this.player.draw()
    this.entities.forEach(e => e.draw())

    /*
    ctx.fillStyle = 'red'
    ctx.fillRect(Tile.size, (this.level.h - 1) * Tile.size, (this.level.w - 2) * Tile.size, 1)
    ctx.fillRect(Tile.size, Tile.size, 1, (this.level.h - 2) * Tile.size)
    ctx.fillRect((this.level.w - 1) * Tile.size, Tile.size, 1, (this.level.h - 2) * Tile.size)
    */

    // unscroll
    ctx.translate(Math.floor(this.camera[0]), Math.floor(this.camera[1]))

    // TODO GUI

    this.tick++
  }
}
