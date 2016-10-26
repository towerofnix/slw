// @flow

// SUPER LIAM WORLD(tm)
// totally not stolen from an-ok-squirrel.
// this is a fair use of the name as specified
// in NANALAND RULES NUMBER #99

type Position = [number, number]

const trimLines = require('trim-lines')

import Tile from './Tile'
import { Player } from './Entity'

export default class SLW {
  keys: Object
  canvas: HTMLCanvasElement

  player: Player
  camera: Position

  activeLevel: { tiles: string }
  tileset: Image

  constructor() {
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

    this.player = new Player(16, 16)

    // @TODO Camera position:
    this.camera = [0, 0]

    this.activeLevel = {
      tiles: trimLines`--------------------
                       --------------------
                       --------------------
                       --------------------
                       ----------------===-
                       --------------------
                       --------------------
                       --------===---------
                       --------------------
                       ==------------------
                       --------------------
                       ----------=?=-------
                       ------=-------------
                       -----===------------
                       ----=====----===----
                       =================---
                       ====================`
    }
  }

  canvasClear() {
    const ctx = this.canvas.getContext('2d')

    if (ctx instanceof CanvasRenderingContext2D)
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  getDrawnPosition([tileX, tileY]: Position): Position {
    return [
      Math.floor(tileX * Tile.size),
      Math.floor(tileY * Tile.size)
    ]
  }

  drawLevelTiles() {
    const rows = this.activeLevel.tiles.split('\n')
    const ctx = this.canvas.getContext('2d')

    if(ctx instanceof CanvasRenderingContext2D) {
      const viewStartX = 0
      const viewStartY = 0
      const viewEndX = 16
      const viewEndY = 16

      for (let y = viewStartY; y < viewEndY; y++) {
        for (let x = viewStartX; x < viewEndX; x++) {
          let row = rows[y] || []
          let tile = row[x] || ''

          const [rendX, rendY] = this.getDrawnPosition([x, y])
          const [tileX, tileY] = Tile.get(tile).position
          ctx.drawImage(
            this.tileset,
            tileX * Tile.size, tileY * Tile.size,
            Tile.size, Tile.size,

            rendX, rendY, Tile.size, Tile.size)
        }
      }
    }
  }
}
