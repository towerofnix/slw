// @flow

import SLW from './SLW'
import { rnd, Empty } from './util'
import { Entity } from './Entity'
import * as entities from './Entity'

import type { Position } from './types'
import type { Sound } from './SoundManager'

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
  layer: number // static

  dx: number
  dy: number

  exists: boolean

  levelid: ?number // WorldLevelTile only

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

  // Called when this Tile comes into existence, e.g. the level loads.
  onCreate() {}

  // Called if and when this Tile is replaced with another.
  onDestroy() {}

  // Called every frame.
  onUpdate() {}

  // Called when a nearby block is set:
  //
  // -----
  // -!!!-
  // -!X!-
  // -!!!-
  // -----
  //
  // (! is a tile that sends the event, X is a this tile, - is a tile not
  // sent the event)
  onNearbyReplace() {}

  // Called if and when this Tile is colliding with an entity.
  // (Won't work if { solid: true }!)
  onTouch(by: Entity) {}

  // Same deal, but for when it's being standed on.
  onStand(by: Entity) {}

  // Air punched, e.g. hitting a question mark block.
  onAirPunch() {}
}

/* // TODO convert this
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
      this.updateTexture()
    }

    onNearbyReplace() {
      this.updateTexture()
    }

    updateTexture() {
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
        this.texPosition = [6, 5]

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

  ['P', class PipeTile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Pipe',
        texPosition: [8, 4],
        solid: true
      })
    }

    onCreate() {
      this.updateTexture()
    }

    onNearbyReplace() {
      this.updateTexture()
    }

    updateTexture() {
      // we need to look at our adjacient tiles to figure out
      // how we should be displayed:

      let topTile    = this.game.level.tileAt([this.x, this.y - 1])
      let bottomTile = this.game.level.tileAt([this.x, this.y + 1])
      let leftTile   = this.game.level.tileAt([this.x - 1, this.y])
      let rightTile  = this.game.level.tileAt([this.x + 1, this.y])

      let top    = topTile.name    === this.name
      let bottom = bottomTile.name === this.name
                || bottomTile.name === 'Ground'
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

      if (!right) this.texPosition[0] = 9
      if (!bottom) this.texPosition[1] = 4
      if (!top)    this.texPosition[1] = 2
      if (top && bottom) this.texPosition[1] = 3
    }
  }],

  ['?', class QBlockTile extends Tile {
    i: number

    punchSound: Sound

    constructor(game) {
      super(game, {
        name: '? Block',
        texPosition: [0, 4],
        solid: true
      })
    }

    onCreate() {
      this.i = 0
      this.punchSound = this.game.sounds.getSound('smw_shell_ricochet')
    }

    onUpdate() {
      this.i += 0.1
      if(this.i >= 4) this.i = 0
      this.texPosition[0] = Math.max(Math.floor(this.i), 0)
    }

    onAirPunch() {
      this.punchSound.playNew()

      if (this.game && this.x && this.y) {
        const tile = new (Tile.get('x'))(this.game)
        const usedBlock = this.game.level.replaceTile([this.x, this.y], tile)
        usedBlock.dy = -0.5 * Tile.size

        let [x, y] = this.game.level.getAbsolutePosition([this.x, this.y])
        let shroom = new Mushroom(this.game, x, 0)
        shroom.y = y - shroom.h - 1
        shroom.yv = -1.5
        this.game.entities.push(shroom)
      }
    }
  }],

  ['x', class UsedBlockTile extends Tile {
    punchSound: Sound

    constructor(game) {
      super(game, {
        name: 'Used Block',
        texPosition: [4, 4],
        solid: true,
      })
    }

    onCreate() {
      // TODO 50% volume
      this.punchSound = this.game.sounds.getSound('smw_shell_ricochet')
    }

    onAirPunch() {
      this.punchSound.playNew()
    }

    onUpdate() {
      if(this.dy < 0) this.dy = Math.ceil(this.dy * 0.9)
      else this.dy = 0
    }
  }],

  ['*', class InvisibleBlockTile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Invisible Block',
        texPosition: [0, 0],
        solid: true
      })
    }
  }],

  ['~', class DonutTile extends Tile {
    fallVelocity: number
    fallCountdown: number
    falling: boolean
    lastStoodOn: number

    constructor(game) {
      super(game, {
        name: 'Donut Block',
        texPosition: [4, 3],
        solid: false,
        solidTop: true
      })

      this.fallVelocity = 0
      this.fallCountdown = 40
      this.falling = false
      this.lastStoodOn = Date.now()
    }

    onUpdate() {
      if (this.falling) {
        this.dy += this.fallVelocity
        this.dx = 0

        if (this.fallVelocity < 6) {
          this.fallVelocity += 0.3
        }
      }

      if (this.lastStoodOn - Date.now() < -5 && !this.falling) {
        // no longer
        this.texPosition = [4, 3]
        this.fallCountdown = 40
        this.dx = 0
        this.dy = 0
      }

      if (this.lastStoodOn - Date.now() < -2500 && this.falling) {
        this.solidTop = true
        this.dx = 0
        this.dy = 0
        this.fallCountdown = 40
        this.texPosition = [4, 3]
        this.fallVelocity = 0
        this.falling = false
      }
    }

    onStand() {
      this.fallCountdown--
      if (this.fallCountdown <= 0) {
        this.falling = true
        this.solidTop = false
      } else {
        this.dx = rnd(-2, 2)
        this.dy = rnd(-2, 2)
      }

      this.lastStoodOn = Date.now()
      this.texPosition = [4, 2]
    }
  }],

  ['-', class AirTile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Air',
        texPosition: [0, 0],
      })
    }

    onCreate() {
      let topTile    = this.game.level.tileAt([this.x, this.y - 1])
      let bottomTile = this.game.level.tileAt([this.x, this.y + 1])
      let leftTile   = this.game.level.tileAt([this.x - 1, this.y])
      let rightTile  = this.game.level.tileAt([this.x + 1, this.y])

      let topLeftTile = this.game.level.tileAt([this.x - 1, this.y - 1])
      let topRightTile = this.game.level.tileAt([this.x + 1, this.y - 1])
      let bottomLeftTile = this.game.level.tileAt([this.x - 1, this.y + 1])
      let bottomRightTile = this.game.level.tileAt([this.x + 1, this.y + 1])

      // if below us is the [centre, top] of ground, randomly place foliage
      if(bottomTile.name === 'Ground' && bottomLeftTile.name === 'Ground' && bottomRightTile.name === 'Ground') {
        let foliage = rnd(0, 4) // 1 in 5 chance of any at all

        if(foliage === 0) {
          let what = rnd(0, 4) // random piece

          if(what === 0) {
            if(topTile.name !== this.name) return

            // tree!
            this.texPosition = [0, 1]
            topTile.texPosition = [1, 0]

          } else {
            this.texPosition = [what, 1]
          }
        }
      }
    }
  }],

  ['C', class CloudTile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Cloud',
        texPosition: [4, 1],
        solidTop: true,
      })
    }
  }],

  // World tiles ///////////////////////////////////////////////////////////////

  ['W ~', class WorldWaterTile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Water',
        texPosition: [0, 15],
      })

      this.solid = true
    }
  }],

  ['W  ', class WorldGroundTile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Ground',
        texPosition: [1, 13],
      })

      this.solid = true
    }

    onUpdate() {
      let topTile    = this.game.level.tileAt([this.x, this.y - 1])
      let bottomTile = this.game.level.tileAt([this.x, this.y + 1])
      let leftTile   = this.game.level.tileAt([this.x - 1, this.y])
      let rightTile  = this.game.level.tileAt([this.x + 1, this.y])

      let top    = topTile.name    !== 'Water'
      let bottom = bottomTile.name !== 'Water'
      let left   = leftTile.name   !== 'Water'
      let right  = rightTile.name  !== 'Water'

      let topLeftTile = this.game.level.tileAt([this.x - 1, this.y - 1])
      let topRightTile = this.game.level.tileAt([this.x + 1, this.y - 1])
      let bottomLeftTile = this.game.level.tileAt([this.x - 1, this.y + 1])
      let bottomRightTile = this.game.level.tileAt([this.x + 1, this.y + 1])

      let topLeft = topLeftTile.name !== 'Water'
      let topRight = topRightTile.name !== 'Water'
      let bottomLeft = bottomLeftTile.name !== 'Water'
      let bottomRight = bottomRightTile.name !== 'Water'

      if(!left && top && right && bottom) this.texPosition = [0, 13]
      if(left && top && !right && bottom) this.texPosition = [2, 13]
      if(left && !top && right && bottom) this.texPosition = [1, 12]
      if(left && top && right && !bottom) this.texPosition = [1, 14]

      if(left && !top && !right && bottom) this.texPosition = [2, 12]
      if(!left && !top && right && bottom) this.texPosition = [0, 12]
      if(left && top && !right && !bottom) this.texPosition = [2, 14]
      if(!left && top && right && !bottom) this.texPosition = [0, 14]

      if(left && top && right && bottom && !topRight) {
        this.texPosition = [3, 13]
      }

      if(left && top && right && bottom && !topLeft) {
        this.texPosition = [4, 13]
      }

      if(left && top && right && bottom && !bottomRight) {
        this.texPosition = [3, 12]
      }

      if(left && top && right && bottom && !bottomLeft) {
        this.texPosition = [4, 12]
      }
    }
  }],

  ['W @', class WorldPlayerTile extends Tile {
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
      this.game.player.y = y// - this.game.player.h + Tile.size

      // replace this tile with a pipe
      const tile = new (Tile.get('W P'))(this.game)
      this.game.level.replaceTile([this.x, this.y], tile)
    }
  }],

  ['W :', class WorldFenceTile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Fence',
        texPosition: [4, 14],
      })

      this.solid = true
    }
  }],

  ['W .', class WorldFlowerTile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Flower',
        texPosition: [3, 14],
      })

      this.solid = true
    }
  }],

  ['W P', class WorldPipeTile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Pipe',
        texPosition: [0, 11],
      })
    }
  }],

  ['W H', class WorldHouseTile extends Tile {
    constructor(game) {
      super(game, {
        name: 'House',
        texPosition: [1, 11],
      })
    }
  }],

  ['W -', class WorldPathTile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Path',
        texPosition: [1, 9],
      })
    }

    onUpdate() {
      let topTile    = this.game.level.tileAt([this.x, this.y - 1])
      let bottomTile = this.game.level.tileAt([this.x, this.y + 1])
      let leftTile   = this.game.level.tileAt([this.x - 1, this.y])
      let rightTile  = this.game.level.tileAt([this.x + 1, this.y])

      const k = [this.name, 'Level', 'Pipe']

      let top    = k.includes(topTile.name)
      let bottom = k.includes(bottomTile.name)
      let left   = k.includes(leftTile.name)
      let right  = k.includes(rightTile.name)

      if(top && !left && !right && bottom) this.texPosition = [2, 8]
      if(top && left && !right && !bottom) this.texPosition = [3, 9]
      if(top && !left && right && bottom) this.texPosition = [2, 10]
      if(!top && !left && right && bottom) this.texPosition = [3, 8]
      if(top && !left && right && !bottom) this.texPosition = [1, 8]
      if(!top && left && !right && bottom) this.texPosition = [1, 10]
    }
  }],

  ['W lv', class WorldLevelTile extends Tile {
    complete: boolean

    constructor(game) {
      super(game, {
        name: 'Level',
        texPosition: [2, 9],
      })

      this.complete = false
    }

    onUpdate() {
      this.texPosition = this.complete ?  [2, 9] : [3, 10]
    }
  }],

  ['W 1', class WorldLevel1Tile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Level 1',
        texPosition: [0, 0],
      })
    }

    onCreate() {
      // replace this tile with a level tile
      const tile = new (Tile.get('W lv'))(this.game)
      tile.levelid = 1
      this.game.level.replaceTile([this.x, this.y], tile)
    }
  }],

  ['W 2', class WorldLevel2Tile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Level 2',
        texPosition: [0, 0],
      })
    }

    onCreate() {
      // replace this tile with a level tile
      const tile = new (Tile.get('W lv'))(this.game)
      tile.levelid = 2
      this.game.level.replaceTile([this.x, this.y], tile)
    }
  }],

  ['W 3', class WorldLevel3Tile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Level 3',
        texPosition: [0, 0],
      })
    }

    onCreate() {
      // replace this tile with a level tile
      const tile = new (Tile.get('W lv'))(this.game)
      tile.levelid = 3
      this.game.level.replaceTile([this.x, this.y], tile)
    }
  }],

  ['W 4', class WorldLevel4Tile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Level 4',
        texPosition: [0, 0],
      })
    }

    onCreate() {
      // replace this tile with a level tile
      const tile = new (Tile.get('W lv'))(this.game)
      tile.levelid = 4
      this.game.level.replaceTile([this.x, this.y], tile)
    }
  }],

  ['W 5', class WorldLevel5Tile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Level 5',
        texPosition: [0, 0],
      })
    }

    onCreate() {
      // replace this tile with a level tile
      const tile = new (Tile.get('W lv'))(this.game)
      tile.levelid = 5
      this.game.level.replaceTile([this.x, this.y], tile)
    }
  }],

  ['W 6', class WorldLevel6Tile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Level 6',
        texPosition: [0, 0],
      })
    }

    onCreate() {
      // replace this tile with a level tile
      const tile = new (Tile.get('W lv'))(this.game)
      tile.levelid = 6
      this.game.level.replaceTile([this.x, this.y], tile)
    }
  }],

  ['W 7', class WorldLevel7Tile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Level 7',
        texPosition: [0, 0],
      })
    }

    onCreate() {
      // replace this tile with a level tile
      const tile = new (Tile.get('W lv'))(this.game)
      tile.levelid = 7
      this.game.level.replaceTile([this.x, this.y], tile)
    }
  }],

  ['W 8', class WorldLevel8Tile extends Tile {
    constructor(game) {
      super(game, {
        name: 'Level 8',
        texPosition: [0, 0],
      })
    }

    onCreate() {
      // replace this tile with a level tile
      const tile = new (Tile.get('W lv'))(this.game)
      tile.levelid = 8
      this.game.level.replaceTile([this.x, this.y], tile)
    }
  }],
])
*/

Tile.size = 16

export class Air extends Tile {
  constructor(game: SLW) {
    super(game, {
      name: 'Air',
      texPosition: [0, 0],
    })
  }

  onCreate() {
    this.updateTexture()
  }

  onNearbyReplace() {
    this.updateTexture()
  }

  updateTexture() {
    let topTile    = this.game.level.tileAt([this.x, this.y - 1])
    let bottomTile = this.game.level.tileAt([this.x, this.y + 1])
    let leftTile   = this.game.level.tileAt([this.x - 1, this.y])
    let rightTile  = this.game.level.tileAt([this.x + 1, this.y])

    let topLeftTile = this.game.level.tileAt([this.x - 1, this.y - 1])
    let topRightTile = this.game.level.tileAt([this.x + 1, this.y - 1])
    let bottomLeftTile = this.game.level.tileAt([this.x - 1, this.y + 1])
    let bottomRightTile = this.game.level.tileAt([this.x + 1, this.y + 1])

    // if below us is the [centre, top] of ground, randomly place foliage
    if(bottomTile.name === 'Ground' && bottomLeftTile.name === 'Ground' && bottomRightTile.name === 'Ground') {
      let foliage = rnd(0, 4) // 1 in 5 chance of any at all

      if(foliage === 0) {
        let what = rnd(0, 4) // random piece

        if(what === 0) {
          if(topTile.name !== this.name) return

          // tree!
          this.texPosition = [0, 1]
          topTile.texPosition = [1, 0]

        } else {
          this.texPosition = [what, 1]
        }
      }
    }
  }
}

export class QuestionBlock extends Tile {
  punchSound: Sound
  output: any

  constructor(game: SLW, opts: Object) {
    super(game, {
      name: '? Block',
      texPosition: [0, 4],
      solid: true
    })

    this.output = entities[opts.output]
  }

  onCreate() {
    this.punchSound = this.game.sounds.getSound('smw_shell_ricochet')
  }

  onUpdate() {
    this.texPosition[0] = Math.floor(this.game.tick / 10) % 4
  }

  onAirPunch() {
    this.punchSound.playNew()

    if (this.game && this.x && this.y) {
      const tile = new UsedBlock(this.game)
      const usedBlock = this.game.level.replaceTile([this.x, this.y], tile)
      usedBlock.dy = -0.5 * Tile.size

      if (this.output) {
        let [x, y] = this.game.level.getAbsolutePosition([this.x, this.y])
        let out = new (this.output)(this.game, x, 0)
        out.y = y - out.h - 1
        out.yv = -1.5
        this.game.entities.push(out)
      }
    }
  }
}

export class UsedBlock extends Tile {
  punchSound: Sound

  constructor(game: SLW) {
    super(game, {
      name: 'Used Block',
      texPosition: [4, 4],
      solid: true,
    })
  }

  onCreate() {
    // TODO 50% volume
    this.punchSound = this.game.sounds.getSound('smw_shell_ricochet')
  }

  onAirPunch() {
    this.punchSound.playNew()
  }

  onUpdate() {
    if(this.dy < 0) this.dy = Math.ceil(this.dy * 0.9)
    else this.dy = 0
  }
}
