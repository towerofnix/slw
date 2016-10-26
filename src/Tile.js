// @flow

type Position = [number, number]

export default class Tile {
  // human-readable name
  name: string

  // absolute [x, y] position in tileset.png
  position: Position

  // true if objects should collide with this tile
  solid: boolean

  constructor(props: Object) {
    this.name = props.name || 'Unknown'
    this.position = props.position
    this.solid = props.solid || false
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
  })],

  ['-', new Tile({
    name: 'Air',
    position: [2, 0],
  })],
])

Tile.size = 16
