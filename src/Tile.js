// @flow

import SLW from './SLW'
type Position = [number, number]

export default class Tile {
  game: SLW

  // Human-readable name
  name: string

  // Absolute [x, y] position in tileset.png
  position: Position

  // true if objects should collide with this tile
  solid: boolean

  x: number
  y: number
  exists: boolean

  constructor(props: Object = {}) {
    this.name = props.name || 'Unknown'
    this.position = props.position
    this.solid = props.solid || false
    this.exists = false
  }

  static size: number

  // Get a Tile class from its String representation.
  static get(str: string): Class<Tile> {
    let tile = tilemap.get(str)

    if(tile) return tile
    else throw new RangeError('Tile ' + str + ' not found.')
  }

  // Called when this Tile comes into existence, e.g. the level loads.
  onCreate() {}

  // Called if and when this Tile is replaced with another.
  onDestroy() {}

  // Called every frame.
  onUpdate() {}

  // Air punched, e.g. hitting a question mark block.
  onAirPunched() {}
}

export const tilemap: Map <string, Class<Tile>> = new Map([
  ['=', class extends Tile {
    constructor() {
      super({
        name: 'Solid Block',
        position: [0, 0],
        solid: true
      })
    }

    onCreate() {
      // we need to look at the adjacient tiles to figure out
      // how we should be displayed:

      /*
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
      */

      // Alex, this is bork!
    }
  }],

  ['?', class extends Tile {
    i: number

    constructor() {
      super({
        name: '? Block',
        position: [0, 4],
        solid: true
      })
    }

    onCreate() {
      this.i = 0
    }

    onUpdate() {
      this.i += 0.1
      if(this.i >= 4) this.i = 0
      this.position[0] = Math.max(Math.floor(this.i), 0)
    }

    onAirPunched() {
      new window.Audio('sound/smw_shell_ricochet.wav').play()

      if (this.game && this.x && this.y) {
        const tile = new (Tile.get('x'))
        this.game.level.replaceTile([this.x, this.y], tile)
      }
    }
  }],

  ['-', class extends Tile {
    constructor() {
      super({
        name: 'Air',
        position: [2, 0],
      })
    }
  }],

  ['x', class extends Tile {
    constructor() {
      super({
        name: '? Block (Used)',
        position: [4, 4],
        solid: true,
      })
    }
  }],

  [' ', class extends Tile {
    constructor() {
      super({
        name: 'Void',
        position: [0, 1],
      })
    }
  }],

  ['0', class extends Tile {
    i: number

    constructor() {
      super({
        name: 'Coin',
        position: [0, 3],
      })
    }

    onCreate() {
      this.i = 0
    }

    onUpdate() {
      this.i += 0.025
      if (this.i >= 4) this.i = 0

      this.position[0] = Math.max(Math.floor(this.i), 0)
    }

    // TODO touch() {}
  }],
])

Tile.size = 16
