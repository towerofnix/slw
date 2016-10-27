// @flow

type Position = [number, number]

export default class Tile {
  // Human-readable name
  name: string

  // Absolute [x, y] position in tileset.png
  position: Position

  // true if objects should collide with this tile
  solid: boolean

  // Various interaction functions
  interaction: {
    // Air punched, e.g. hitting a question mark block.
    airPunched: Function
  }

  constructor(props: Object) {
    this.name = props.name || 'Unknown'
    this.position = props.position
    this.solid = props.solid || false
    this.interaction = props.interaction || {}
  }

  static size: number

  // Get a Tile from its String representation.
  static get(str: string): Tile {
    let tile = tilemap.get(str)

    if(tile) return tile
    else throw new RangeError('Tile ' + str + ' not found.')
  }

  // Get a Tile from its Position in the activeLevel.
  static at([tileX: number, tileY: number]): Tile {
    const rows = window.game.activeLevel.tiles.split('\n')
    const tile = rows[Math.floor(tileY)][Math.floor(tileX)]

    return Tile.get(tile)
  }

  onAirPunched() {}
}

export const tilemap: Map <string, Tile> = new Map([
  ['=', new Tile({
    name: 'Solid Block',
    position: [0, 0],
    solid: true,
  })],

  ['?', new Tile({
    name: '? Block',
    position: [1, 0],
    solid: true,
    interaction: {
      airPunched() {
        new window.Audio('sound/smw_shell_ricochet.wav').play()
        window.game.placeTile([this.x, this.y], 'x')
      }
    }
  })],

  ['-', new Tile({
    name: 'Air',
    position: [2, 0],
  })],

  ['x', new Tile({
    name: 'Punched ? Block',
    position: [3, 0],
    solid: true
  })],
])

Tile.size = 16
