// @flow

export default class Tile {
  // human-readable name
  name: string

  // absolute [x, y] position in tileset.png
  position: Position

  // true if objects should collide with this tile
  solid: boolean

  constructor(properties: Object) {
    for(let key of Object.keys(properties)) {
      this[key] = properties[key]
    }
  }
}

export const tilemap = new Map([
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
    solid: false,
  })],
])

// Get a Tile from its String representation.
Tile.get = (str: string): Tile => tilemap.get(str)

// Tiles are 16x16px.
Tile.size = 16
