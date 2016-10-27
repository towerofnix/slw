// @flow

// SUPER LIAM WORLD(tm)
// totally not stolen from an-ok-squirrel.
// this is a fair use of the name as specified
// in NANALAND RULES NUMBER #99

type Position = [number, number]

const trimLines = require('trim-lines')

import Tile from './Tile'
import Level from './Level'
import { Player } from './Entity'

export default class SLW {
  // Map to store key-pressed data in.
  keys: Object

  // Canvas used to display the game on.
  canvas: HTMLCanvasElement

  // Player object - the character that walks around the screen using the
  // user's input as controls.
  player: Player

  // Camera object - where the camera is. TODO make this a class
  camera: Position

  // Level, to contain information about the currently active level.
  level: Level

  constructor(leveldata: string, tileset: Image) {
    this.keys = {}

    this.canvas = document.createElement('canvas')
    this.canvas.width = 256
    this.canvas.height = 256

    this.canvas.addEventListener('keydown', (evt: KeyboardEvent) => {
      this.keys[evt.keyCode] = true
    })

    this.canvas.addEventListener('keyup', (evt: KeyboardEvent) => {
      this.keys[evt.keyCode] = false
    })

    this.canvas.setAttribute('tabindex', '1')

    this.player = new Player(this, 16, 16)

    // @TODO Camera:
    this.camera = [0, 0]

    this.level = new Level(this, [1, 1], trimLines(leveldata), tileset)

    // Call create() on the Level tilemap
    for (let row of this.level.tilemap) {
      for (let tile of row) {
        if (tile.on.create) tile.on.create.apply(tile)
      }
    }
  }

  // Clears the game canvas.
  canvasClear() {
    const ctx = this.canvas.getContext('2d')

    if (ctx instanceof CanvasRenderingContext2D) {
      ctx.fillStyle = '#f8e0b2'
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }
  }
}
