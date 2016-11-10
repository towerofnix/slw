// @flow

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
import { Entity } from './Entity'
import { levels } from './util'
import { Sound } from './SoundManager'

import type { Position } from './types'

import * as entities from './Entity'
import * as tiles from './Tile'

export default class Level {
  game: SLW

  meta: Object // see levels.hjson
  tileset: Image

  tiles: Array <Tile>
  entities: Array <Entity>

  w: number // width
  h: number // height

  music: Sound
  editorEnabled: boolean

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
    this.entities = []
    this.meta = levels[levelid]

    // Editor mode btn:

    /*
    const editorEnabledEl_o = document.getElementById('editorEnabled')
    const editorEnabledEl = editorEnabledEl_o.cloneNode()

    this.editorEnabled = !this.meta.special.includes('world') && localStorage['editorEnabled'] === 'true'
    // @flow ignore
    editorEnabledEl.disabled = this.meta.special.includes('world')
    editorEnabledEl.innerText = this.editorEnabled ? 'Editor ON' : 'Editor OFF'

    editorEnabledEl.addEventListener('click', (evt: Event) => {
      this.game.cameraInEditor = this.game.camera // set camera position
      this.editorEnabled = !this.editorEnabled
      localStorage['editorEnabled'] = this.editorEnabled.toString()
      editorEnabledEl.innerText = this.editorEnabled ? 'Editor ON' : 'Editor OFF'
    })

    // @flow ignore
    editorEnabledEl_o.parentNode.replaceChild(editorEnabledEl, editorEnabledEl_o)
    */

    const tilemap = this.meta.tiles
    this.tiles = []

    for (let k of tilemap) {
      const [ id, x, y, layer, opts ] = k

      let tile = new (tiles[id])(this.game, opts)

      tile.x = x
      tile.y = y
      tile.layer = layer
      tile.game = game
      tile.exists = true

      this.tiles.push(tile)
    }

    this.h = this.meta.height
    this.w = this.meta.width

    this.music = this.game.sounds.getSound(`music/${this.meta.music}.mp3`)

    // Normalize music.
    this.music.volume = MUSIC_VOLUMES[this.meta.music] || 0.5

    // Background music should loop.
    this.music.loops = true

    this.music.playNew()
  }

  create() {
    // Call create() on the Level Tiles
    for (let tile of this.tiles) {
      tile.onCreate()
    }

    // Create all entities
    for (let def of this.meta.entities) {
      const constructor = entities[def.shift()]

      let ent = new constructor(this.game, ...def)
      this.entities.push(ent)
    }
  }

  destroy() {
    this.music.stop()

    // TODO Entity destroying? Might not be a bad idea, e.g. if entities have
    // set event listeners that reference themselves... they wouldn't be GC'd.
    this.game.entities.splice(0, this.game.entities.length)
  }

  update() {
    // Call update() on the tilemap's Tiles
    for (let tile of this.tiles) {
      tile.onUpdate()
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
        const tiles = this.tilesAt([x, y])
        const [rendX, rendY] = this.getAbsolutePosition([x, y])

        for (let tile of tiles) {
          const [tileX, tileY] = tile.texPosition

          ctx.drawImage(
            this.tileset,
            tileX * Tile.size, tileY * Tile.size,
            Tile.size, Tile.size,

            rendX + tile.dx, rendY + tile.dy, Tile.size, Tile.size)
        }
      }
    }
  }

  // DEPRECATED
  // Get a Tile from its Position and layer in the tilemap.
  tileAt([tileX: number, tileY: number]: Position, layer: number = 0): Tile {
    tileX = Math.floor(tileX)
    tileY = Math.floor(tileY)
    layer = Math.floor(layer)

    try {
      let r = this.tiles.filter(tile =>
        tile.layer === layer &&
        tile.x === tileX &&
        tile.y === tileY)[0]
      if(typeof r === 'undefined') throw 'nope'
      return r
    } catch(e) {
      // fallback to Air tile
      //console.warn(`Level.tileAt([${tileX}, ${tileY}]): Failed to retrieve Tile`)
      return new (tiles.Air)(this.game)
    }
  }

  // Get some Tiles from their Position in the tilemap.
  tilesAt([tileX: number, tileY: number]: Position): Array <Tile> {
    tileX = Math.floor(tileX)
    tileY = Math.floor(tileY)

    return this.tiles.filter(tile =>
      tile.x === tileX &&
      tile.y === tileY)
  }

  replaceTile([
    tileX: number, tileY: number
  ]: Position, newTile: Tile, layer: number = 0): Tile {
    newTile.x = tileX
    newTile.y = tileY
    newTile.layer = layer
    newTile.game = this.game
    newTile.exists = true

    let oldTile = this.tileAt([tileX, tileY], layer)
    oldTile.exists = false
    oldTile.onDestroy()

    this.tiles.push(newTile)
    newTile.onCreate()

    // Send an onNearbyReplace event to all nearby tiles - see onNearbyReplace
    for (let y = tileY - 1; y <= tileY + 1; y++) {
      for (let x = tileX - 1; x <= tileX + 1; x++) {
        const tile = this.tileAt([x, y], layer)
        if (tile && tile !== newTile) {
          tile.onNearbyReplace()
        }
      }
    }

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
