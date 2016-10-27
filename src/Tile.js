// @flow

import SLW from './SLW'
import { Entity, Player, Goomba, Mushroom } from './Entity'

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

  constructor(game: SLW, props: Object = {}) {
    this.game = game

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

  // Called if and when this Tile is colliding with an entity.
  // (Won't work if { solid: true }!)
  onTouch(by: Entity) {}

  // Air punched, e.g. hitting a question mark block.
  onAirPunch() {}
}

export const tilemap: Map <string, Class<Tile>> = new Map([
  ['=', class extends Tile {
    constructor(game) {
      super(game, {
        name: 'Ground',
        position: [4, 5],
        solid: true
      })
    }

    onCreate() {
      // we need to look at our adjacient tiles to figure out
      // how we should be displayed:

      let topTile    = this.game.level.tileAt([this.x, this.y - 1])
      let bottomTile = this.game.level.tileAt([this.x, this.y + 1])
      let leftTile   = this.game.level.tileAt([this.x - 1, this.y])
      let rightTile  = this.game.level.tileAt([this.x + 1, this.y])

      let top    = topTile.name    === this.name
      let bottom = bottomTile.name === this.name
      let left   = leftTile.name   === this.name
      let right  = rightTile.name  === this.name

      let topLeftTile = this.game.level.tileAt([this.x - 1, this.y - 1])
      let topRightTile = this.game.level.tileAt([this.x + 1, this.y - 1])
      let bottomLeftTile = this.game.level.tileAt([this.x - 1, this.y + 1])
      let bottomRightTile = this.game.level.tileAt([this.x + 1, this.y + 1])

      let topLeft = topLeftTile.name === this.name
      let topRight = topRightTile.name === this.name
      let bottomLeft = bottomLeftTile.name === this.name
      let bottomRight = bottomRightTile.name === this.name

      if(top && left && right && bottom) this.position = [1, 6]
      if(!top && left && right && bottom) this.position = [1, 5]
      if(!top && !left && right && bottom) this.position = [0, 5]
      if(!top && left && !right && bottom) this.position = [2, 5]
      if(top && !left && right && bottom) this.position = [0, 6]
      if(top && !left && right && !bottom) this.position = [0, 7]
      if(top && left && right && !bottom) this.position = [1, 7]
      if(top && left && !right && !bottom) this.position = [2, 7]
      if(top && left && !right && bottom) this.position = [2, 6]

      if(top && left && right && bottom && !topLeft && !topRight)
        this.position = [5, 5]

      if(top && left && right && bottom && !topLeft && topRight)
        this.position = [3, 6]

      if(top && left && right && bottom && topLeft && !topRight)
        this.position = [4, 6]

      if(top && left && right && bottom && !bottomLeft)
        this.position = [6, 6]

      if(top && left && right && bottom && !bottomRight)
        this.position = [5, 6]

      if(!top && left && right && bottom && !bottomRight)
        this.position = [8, 5]

      if(!top && left && right && bottom && !bottomLeft)
        this.position = [7, 5]

      if(top && left && right && !bottom && !topLeft && !topRight)
        this.position = [6, 7]

      if(!top && !left && right && !bottom) this.position = [3, 7]
      if(left && right && !bottom && !top) this.position = [4, 7]
      if(left && !right && !bottom && !top) this.position = [5, 7]
      if(!top && !left && !right && bottom) this.position = [3, 5]

      // TODO
    }
  }],

  ['?', class extends Tile {
    i: number

    constructor(game) {
      super(game, {
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

    onAirPunch() {
      new window.Audio('sound/smw_shell_ricochet.wav').play()

      if (this.game && this.x && this.y) {
        const tile = new (Tile.get('x'))(this.game)
        this.game.level.replaceTile([this.x, this.y], tile)

        const [x, y] = this.game.level.getAbsolutePosition([this.x, this.y])
        let shroom = new Mushroom(this.game, x, 0)
        shroom.y = y - shroom.h - 1
        shroom.yv = -1.5
        this.game.entities.push(shroom)
      }
    }
  }],

  ['x', class extends Tile {
    constructor(game) {
      super(game, {
        name: '? Block (Used)',
        position: [4, 4],
        solid: true,
      })
    }
  }],

  ['-', class extends Tile {
    constructor(game) {
      super(game, {
        name: 'Air',
        position: [0, 1],
      })
    }
  }],

  ['0', class extends Tile {
    i: number

    coinSound: window.Audio

    constructor(game) {
      super(game, {
        name: 'Coin',
        position: [0, 3],
      })

      this.coinSound = new window.Audio('sound/smw_coin.wav')
    }

    onCreate() {
      this.i = 0
    }

    onUpdate() {
      this.i += 0.1
      if (this.i >= 4) this.i = 0

      this.position[0] = Math.max(Math.floor(this.i), 0)
    }

    onTouch() {
      // TODO add 1 to coins

      // replace this tile with Air
      const tile = new (Tile.get('-'))(this.game)
      this.game.level.replaceTile([this.x, this.y], tile)
      this.coinSound.play()
    }
  }],

  ['@', class extends Tile {
    constructor(game) {
      super(game, {
        name: 'Player',
        position: [0, 0],
      })
    }

    onCreate() {
      // place the player here
      const [x, y] = this.game.level.getAbsolutePosition([this.x, this.y])
      this.game.player.x = x
      this.game.player.y = y - this.game.player.h + Tile.size - 1 // directly
                                                                  // on top

      // replace this tile with Air
      const tile = new (Tile.get('-'))(this.game)
      this.game.level.replaceTile([this.x, this.y], tile)
    }
  }],

  ['G', class extends Tile {
    constructor(game) {
      super(game, {
        name: 'Goomba',
        position: [0, 0],
      })
    }

    onCreate() {
      // place a goomba here
      let goomba = new Goomba(this.game)
      const [x, y] = this.game.level.getAbsolutePosition([this.x, this.y])
      goomba.x = x
      goomba.y = y - goomba.h + Tile.size - 1 // directly on top

      this.game.entities.push(goomba)

      // replace this tile with Air
      const tile = new (Tile.get('-'))(this.game)
      this.game.level.replaceTile([this.x, this.y], tile)
    }
  }],

  ['>', class extends Tile {
    constructor(game) {
      super(game, {
        name: 'Camera Boundary (Left)',
        position: [0, 0],
        solid: true,
      })
    }

    onUpdate() {
      let dist = (this.x + 1) * Tile.size

      if (this.game.camera[0] < dist)
        this.game.camera[0] = dist
    }
  }],

  ['<', class extends Tile {
    constructor(game) {
      super(game, {
        name: 'Camera Boundary (Right)',
        position: [0, 0],
        solid: true,
      })
    }

    onUpdate() {
      let dist = (this.x + 1) * Tile.size

      if (this.game.camera[0] > dist)
        this.game.camera[0] = dist
    }
  }],

  ['^', class extends Tile {
    constructor(game) {
      super(game, {
        name: 'Camera Boundary (Bottom)',
        position: [0, 0],
        solid: true,
      })
    }

    onUpdate() {
      let dist = (this.y + 1) * Tile.size

      console.log(this.game.camera[1], dist)

      if (this.game.camera[1] > dist)
        this.game.camera[1] = dist
    }
  }],

  ['v', class extends Tile {
    constructor(game) {
      super(game, {
        name: 'Camera Boundary (Top)',
        position: [0, 0],
        solid: true,
      })
    }

    onUpdate() {
      let dist = (this.y + 1) * Tile.size

      if (this.game.camera[1] < dist)
        this.game.camera[1] = dist
    }
  }],

  ['#', class extends Tile {
    constructor(game) {
      super(game, {
        name: 'Death Zone',
        position: [0, 0],
      })
    }

    onTouch(by: Entity) {
      // TODO destroy it
      if(by instanceof Player) console.warn('you are ded')
    }
  }],
])

Tile.size = 16
