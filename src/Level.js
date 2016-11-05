// @flow

const toml = require('toml')

const MUSIC_VOLUMES = {
  airship: 0.25,
  athletic: 0.25,
  beach: 1,
  castle: 0.25,
  'ice-cave': 0.25,
  'file-select': 0.5,
  'flower-gardens': 1,
  'grassland': 0.15,
  'jungle': 0.25,
  'kapper-valley': 0.25,
  'star-world': 0.25,
  'underwater-underworld': 1,
  'water': 0.25,
  'underground': 0.5,
}

import SLW from './SLW'
import Tile from './Tile'
import { levels } from './util'

type Position = [number, number]

export default class Level {
  game: SLW

  meta: Object // see levels.toml
  tileset: Image
  tilemap: Array <Array <Tile>>
  debug: boolean

  w: number // width
  h: number // height

  music: window.Audio
  
  static metaOf(levelid) {
    return levels[levelid]
  }

  constructor(
    game: SLW,
    levelid: string,
    tileset: Image,
  ) {
    this.game = game

    this.tileset = tileset
    this.meta = levels[levelid]
    this.debug = this.meta.debug ? true : false

    const leveldata = this.meta.tilemap

    // Convert tilemap into a 2D array of Tiles:
    this.tilemap = []
    let rows = leveldata.split('\n')
    for (let y = 0; y < rows.length-1; y++) {
      this.tilemap[y] = []
      let row = rows[y]
      for (let x = 0; x < row.length; x++) {
        let tileid = row[x]
        if(this.meta.special.includes('world')) tileid = 'W ' + tileid
        
        let tile = new (Tile.get(tileid))(this.game)

        tile.x = x
        tile.y = y
        tile.game = game
        tile.exists = true

        this.tilemap[y].push(tile)
      }
    }

    this.h = this.tilemap.length
    this.w = this.tilemap[0].length

    this.music = new window.Audio('sound/music/' + this.meta.music + '.mp3')
    this.music.volume = MUSIC_VOLUMES[this.meta.music] || 0.5 // to normalize
    this.music.loop = true
    this.music.play() // load automatically
  }
  
  create() {
    // Call create() on the Level Tiles
    for (let row of this.tilemap) {
      for (let tile of row) {
        tile.onCreate()
      }
    }
  }
  
  destroy() {
    this.music.pause()
  }

  update() {
    // Call update() on the tilemap's Tiles
    for (let row of this.tilemap) {
      for (let tile of row) {
        tile.onUpdate()
      }
    }
  }

  draw() {
    // Draw the tilemap
    const ctx = this.game.canvas.getContext('2d')
    if (!(ctx instanceof CanvasRenderingContext2D)) return

    const viewStartX = Math.floor(this.game.camera[0] / Tile.size)
    const viewStartY = Math.floor(this.game.camera[1] / Tile.size)
    const viewEndX = Math.ceil(this.game.camera[0] / Tile.size) + 25
    const viewEndY = Math.ceil(this.game.camera[1] / Tile.size) + 25

    for (let y = viewStartY; y < viewEndY; y++) {
      for (let x = viewStartX; x < viewEndX; x++) {
        const tile = this.tileAt([x, y])
        const [rendX, rendY] = this.getAbsolutePosition([x, y])
        const [tileX, tileY] = tile.texPosition

        ctx.drawImage(
          this.tileset,
          tileX * Tile.size, tileY * Tile.size,
          Tile.size, Tile.size,

          rendX + tile.dx, rendY + tile.dy, Tile.size, Tile.size)
      }
    }
  }

  // Get a Tile from its Position in the tilemap.
  tileAt([tileX: number, tileY: number]: Position): Tile {
    tileX = Math.floor(tileX)
    tileY = Math.floor(tileY)

    try {
      let r = this.tilemap[tileY][tileX]
      if(typeof r === 'undefined') throw 'nope'
      return r
    } catch(e) {
      // fallback to Air tile
      //console.warn(`Level.tileAt([${tileX}, ${tileY}]): Failed to retrieve Tile`)
      return new (Tile.get('-'))(this.game)
    }
  }

  replaceTile([tileX: number, tileY: number]: Position, newTile: Tile): Tile {
    newTile.x = tileX
    newTile.y = tileY
    newTile.game = this.game
    newTile.exists = true

    let oldTile = this.tileAt([tileX, tileY])
    oldTile.exists = false
    oldTile.onDestroy()

    this.tilemap[tileY][tileX] = newTile
    newTile.onCreate()

    return newTile
  }

  // Gets the drawn position of a given tile position. For example, assuming
  // that the tile size is 16, getDrawnPosition([0, 2]) would become [0, 32].
  getAbsolutePosition([tileX, tileY]: Position): Position {
    return [
      Math.floor(tileX * Tile.size),
      Math.floor(tileY * Tile.size)
    ]
  }
}
