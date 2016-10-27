// @flow

import SLW from './SLW'
type Position = [number, number]

export default class Tile {
  game: ?SLW

  // Human-readable name
  name: string

  // Absolute [x, y] position in tileset.png
  position: Position

  // true if objects should collide with this tile
  solid: boolean

  x: ?number
  y: ?number
  exists: boolean

  // Various interaction/event functions
  on: {
    // Called when this Tile comes into existence, e.g. the level loads.
    create: Function,

    // Called if and when this Tile is replaced with another.
    destroy: Function,

    // Called every frame.
    update: Function,

    // Air punched, e.g. hitting a question mark block.
    airPunched: Function,
  }

  constructor(props: Object) {
    this.name = props.name || 'Unknown'
    this.position = props.position
    this.solid = props.solid || false
    this.on = props.on || {}
    this.exists = false
  }

  static size: number

  // Get a Tile from its String representation.
  static get(str: string): Tile {
    let tile = tilemap.get(str)

    if(tile) return tile
    else throw new RangeError('Tile ' + str + ' not found.')
  }

  /*
  // Get a Tile from its Position in the activeLevel.
  static at([tileX: number, tileY: number]): Tile {
    const rows = window.game.activeLevel.tiles.split('\n')
    const tile = rows[Math.floor(tileY)][Math.floor(tileX)]

    return Tile.get(tile)
  }
  */
}

export const tilemap: Map <string, Tile> = new Map([
  ['=', new Tile({
    name: 'Ground',
    position: [0, 0],
    solid: true,
    on: {
      create() {
        // we need to look at the adjacient tiles to figure out
        // how we should be displayed:

        let topTile    = this.game.level.tileAt([this.x, this.y - 1])
        let bottomTile = this.game.level.tileAt([this.x, this.y + 1])
        let leftTile   = this.game.level.tileAt([this.x - 1, this.y])
        let rightTile  = this.game.level.tileAt([this.x + 1, this.y])

        let top    = topTile.name === this.name
        let bottom = bottomTile   === this.name
        let left   = leftTile     === this.name
        let right  = rightTile    === this.name

        if(top && left && right && bottom) this.position = [6, 1]
        if(!top && left && right && bottom) this.position = [5, 1]
        if(!top && !left && right && bottom) this.position = [5, 0]
        if(!top && left && !right && bottom) this.position = [5, 2]

        if(!top && !left && !right && bottom) this.position = [3, 5]

        // TODO add other states
        console.log(topTile, leftTile, rightTile, bottomTile, this.position)
      }
    }
  })],

  ['?', new Tile({
    name: '? Block',
    position: [0, 4],
    solid: true,
    on: {
      create() {
        this.i = 0
      },

      update() {
        this.i += 0.1
        if(this.i >= 4) this.i = 0

        this.position[0] = Math.max(Math.floor(this.i), 0)
      },

      airPunched() {
        new window.Audio('sound/smw_shell_ricochet.wav').play()
        this.game.level.replaceTile([this.x, this.y], Tile.get('x'))
      }
    },
  })],

  ['-', new Tile({
    name: 'Air',
    position: [2, 0],
  })],

  ['x', new Tile({
    name: 'Punched ? Block',
    position: [3, 0],
    solid: true,
  })],

  [' ', new Tile({
    name: 'Void',
    position: [0, 1],
  })],

  ['0', new Tile({
    name: 'Coin',
    position: [0, 3],
    on: {
      create() {
        this.i = 0
      },

      update() {
        this.i += 0.025
        if(this.i >= 4) this.i = 0

        this.position[0] = Math.max(Math.floor(this.i), 0)
      },

      // TODO touch() {}
    }
  })],
])

Tile.size = 16
