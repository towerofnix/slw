// @flow

import SLW from './SLW'
import { Entity, Player, Goomba, Mushroom, Sign, Coin } from './Entity'

type Position = [number, number]

export default class Tile {
  game: SLW

  // Human-readable name
  name: string

  // Absolute [x, y] position in tileset.png
  texPosition: Position

  // true if objects should collide with this tile
  solid: boolean

  // If solid is false, should the top be solid anyways?
  solidTop: boolean

  x: number // static
  y: number // static
  dx: number
  dy: number

  exists: boolean

  constructor(game: SLW, props: Object = {}) {
    this.game = game

    this.name = props.name || 'Unknown'
    this.texPosition = props.texPosition
    this.solid = props.solid || false
    this.solidTop = props.solidTop || false
    this.exists = false

    this.dx = 0
    this.dy = 0
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

  // Same deal, but for when it's being standed on.
  onStand(by: Entity) {}

  // Air punched, e.g. hitting a question mark block.
  onAirPunch() {}
}

export const tilemap: Map <string, Class<Tile>> = new Map([
  ['=', class GroundTile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Ground',
        texPosition: [4, 5],
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

      if(top && left && right && bottom) this.texPosition = [1, 6]
      if(!top && left && right && bottom) this.texPosition = [1, 5]
      if(!top && !left && right && bottom) this.texPosition = [0, 5]
      if(!top && left && !right && bottom) this.texPosition = [2, 5]
      if(top && !left && right && bottom) this.texPosition = [0, 6]
      if(top && !left && right && !bottom) this.texPosition = [0, 7]
      if(top && left && right && !bottom) this.texPosition = [1, 7]
      if(top && left && !right && !bottom) this.texPosition = [2, 7]
      if(top && left && !right && bottom) this.texPosition = [2, 6]

      if(top && left && right && bottom && !topLeft && !topRight)
        this.texPosition = [5, 5]

      if(top && left && right && bottom && !topLeft && topRight)
        this.texPosition = [3, 6]

      if(top && left && right && bottom && topLeft && !topRight)
        this.texPosition = [4, 6]

      if(top && left && right && bottom && !bottomLeft)
        this.texPosition = [6, 6]

      if(top && left && right && bottom && !bottomRight)
        this.texPosition = [5, 6]

      if(!top && left && right && bottom && !bottomRight)
        this.texPosition = [8, 5]

      if(!top && left && right && bottom && !bottomLeft)
        this.texPosition = [7, 5]

      if(top && left && right && !bottom && !topLeft && !topRight)
        this.texPosition = [6, 7]

      if(!top && !left && right && !bottom) this.texPosition = [3, 7]
      if(left && right && !bottom && !top) this.texPosition = [4, 7]
      if(left && !right && !bottom && !top) this.texPosition = [5, 7]
      if(!top && !left && !right && bottom) this.texPosition = [3, 5]

      if(top && !left && !right && bottom) this.texPosition = [7, 6]
      if(top && !left && !right && !bottom) this.texPosition = [7, 7]

      if(top && left && !right && bottom && !topLeft) this.texPosition = [8, 5]

      // TODO
    }
  }],

  ['?', class QBlockTile extends Tile {
    i: number

    constructor(game) {
      super(game, {
        name: '? Block',
        texPosition: [0, 4],
        solid: true
      })
    }

    onCreate() {
      this.i = 0
    }

    onUpdate() {
      this.i += 0.1
      if(this.i >= 4) this.i = 0
      this.texPosition[0] = Math.max(Math.floor(this.i), 0)
    }

    onAirPunch() {
      new window.Audio('sound/smw_shell_ricochet.wav').play()

      if (this.game && this.x && this.y) {
        const tile = new (Tile.get('x'))(this.game)
        const usedBlock = this.game.level.replaceTile([this.x, this.y], tile)
        usedBlock.dy = -0.5 * Tile.size

        const [x, y] = this.game.level.getAbsolutePosition([this.x, this.y])
        let shroom = new Mushroom(this.game, x, 0)
        shroom.y = y - shroom.h - 1
        shroom.yv = -1.5
        this.game.entities.push(shroom)
      }
    }
  }],

  ['x', class UsedBlockTile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Used Block',
        texPosition: [4, 4],
        solid: true,
      })
    }

    onAirPunch() {
      let snd = new window.Audio('sound/smw_shell_ricochet.wav')
      snd.volume = 0.5
      snd.play()
    }

    onUpdate() {
      if(this.dy < 0) this.dy = Math.ceil(this.dy * 0.9)
      else this.dy = 0
    }
  }],

  ['~', class DonutTile extends Tile {
    fallVelocity: number
    fallCountdown: number
    falling: boolean

    constructor(game) {
      super(game, {
        name: 'Donut Block',
        texPosition: [4, 3],
        solid: false,
        solidTop: true
      })

      this.fallVelocity = 0
      this.fallCountdown = 30
      this.falling = false
    }

    onUpdate() {
      if (this.falling) {
        this.dy += this.fallVelocity

        if (this.fallVelocity < 6) {
          this.fallVelocity += 0.3
        }
      }
    }

    onStand() {
      this.fallCountdown--
      if (this.fallCountdown <= 0) {
        this.falling = true
        this.solidTop = false
      }
      console.log('Hi')
    }
  }],

  ['-', class AirTile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Air',
        texPosition: [0, 1],
      })
    }
  }],

  ['0', class CoinTile extends Tile {
    i: number

    coinSound: window.Audio

    constructor(game) {
      super(game, {
        name: 'Coin',
        texPosition: [0, 3],
      })

      this.coinSound = new window.Audio('sound/smw_coin.wav')
    }

    onCreate() {
      this.i = 0

      const tile = new (Tile.get('-'))(this.game)
      const coin = new Coin(this.game)
      const [x, y] = this.game.level.getAbsolutePosition([this.x, this.y])
      coin.x = x
      coin.y = y - coin.h + Tile.size - 1 // directly on top

      this.game.level.replaceTile([this.x, this.y], tile)
      this.game.entities.push(coin)
    }

    onUpdate() {
      this.i += 0.1
      if (this.i >= 4) this.i = 0

      this.texPosition[0] = Math.max(Math.floor(this.i), 0)
    }

    onTouch(by: Entity) {
      if(by instanceof Player) {
        // TODO add 1 to coins

        // replace this tile with Air
        const tile = new (Tile.get('-'))(this.game)
        this.game.level.replaceTile([this.x, this.y], tile)
        this.coinSound.play()
      }
    }
  }],

  ['@', class PlayerTile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Player',
        texPosition: [0, 0],
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

  ['>', class SignTile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Sign',
        texPosition: [0, 0],
      })
    }

    onCreate() {
      // place a sign here
      let sign = new Sign(this.game)
      const [x, y] = this.game.level.getAbsolutePosition([this.x, this.y])
      sign.x = x
      sign.y = y - sign.h + Tile.size - 2 // 1 block above top

      // replace this tile with Air
      const tile = new (Tile.get('-'))(this.game)
      this.game.level.replaceTile([this.x, this.y], tile)
    }
  }],

  ['G', class GoombaTile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Goomba',
        texPosition: [0, 0],
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

  ['#', class DeathZoneTile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Death Zone',
        texPosition: [0, 0],
      })
    }

    onTouch(by: Entity) {
      // TODO destroy it
      if(by instanceof Player) console.warn('you are ded')
    }
  }],
])

Tile.size = 16
