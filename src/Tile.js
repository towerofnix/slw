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
  }],

  ['?', class extends Tile {
    constructor() {
      super({
        name: '? Block',
        position: [1, 0],
        solid: true
      })
    }

    onAirPunched() {
      new window.Audio('sound/smw_shell_ricochet.wav').play()

      if (this.game && this.x && this.y) {
        const tile = new Tile.get('x')
        // this.game.level.replaceTile([this.x, this.y], tile)
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
        name: 'Punched ? Block',
        position: [3, 0],
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
])

Tile.size = 16
