// @flow

let ___

// SUPER LIAM WORLD(tm)
// totally not stolen from an-ok-squirrel.
// this is a fair use of the name as specified
// in NANALAND RULES NUMBER #99

const trimLines = require('trim-lines')

class SLW {
  constructor() {
    this.keys = {}

    this.canvas = document.createElement('canvas')
    this.canvas.width = 256
    this.canvas.height = 256

    this.canvas.addEventListener('keydown', evt => {
      this.keys[evt.keyCode] = true
    })
    this.canvas.addEventListener('keyup', evt => {
      this.keys[evt.keyCode] = false
    })

    this.canvas.setAttribute('tabindex', 1)

    // Player position in tiles.
    this.playerX = 0
    this.playerY = 6

    // Player velocity in tiles per tick.
    this.playerXV = 0
    this.playerYV = 0

    // Camera position, probably to be done later
    this.cameraX = 0
    this.cameraY = 0

    // Generally this should probably be 1:1
    this.tileSize = 16
    this.textureSize = 16

    this.activeLevel = {
      tiles: trimLines`--------------------
                       --------------------
                       --------------------
                       --------------------
                       --------------------
                       --------------------
                       --------------------
                       --------------------
                       --------------------
                       =-------------------
                       --------------------
                       ----------=?=-------
                       ------=-------------
                       -----===------------
                       ----=====----===----
                       =================---
                       ====================`
    }
  }

  canvasClear() {
    const ctx = this.canvas.getContext('2d')
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  getDrawnPosition(tileX, tileY) {
    // Fill in the blanks!
    return [
      Math.floor(tileX * this.tileSize),
      Math.floor(tileY * this.tileSize)
    ]
  }

  getTilePosition(tile) {
    switch(tile) {
      case '@': return [0, 1]
      case '-': return [2, 0]
      case '?': return [1, 0]
      case '=': return [0, 0]
      default:  return [0, 0]
    }
  }

  drawLevelTiles() {
    const rows = this.activeLevel.tiles.split('\n')

    const ctx = this.canvas.getContext('2d')

    // Fill in the blanks!
    const viewStartX = 0
    const viewStartY = 0
    const viewEndX = 16
    const viewEndY = 16

    for (let y = viewStartY; y < viewEndY; y++) {
      for (let x = viewStartX; x < viewEndX; x++) {
        let row = rows[y] || []
        let tile = row[x] || ''

        const [rendX, rendY] = this.getDrawnPosition(x, y)
        const [tileX, tileY] = this.getTilePosition(tile)
        ctx.drawImage(
          this.tileset,
          tileX * this.textureSize, tileY * this.textureSize,
          this.textureSize, this.textureSize,

          rendX, rendY, this.tileSize, this.tileSize)
      }
    }

    ctx.fillStyle = 'blue'
    const [pRendX, pRendY] = this.getDrawnPosition(this.playerX, this.playerY)
    const [pTileX, pTileY] = this.getTilePosition('@')
    // ctx.fillRect(pRendX, pRendY, 16, 32)
    ctx.drawImage(
      this.tileset,
      pTileX * this.textureSize, pTileY * this.textureSize,
      this.textureSize, this.textureSize,

      pRendX, pRendY, this.tileSize, this.tileSize)

    /*console.log(
      'Looped tiles:', (viewEndX - viewStartX) * (viewEndY - viewStartY)
    )*/
  }

  inputMovement() {
    if (this.keys[39]) {
      this.playerXV = 0.15
    }

    if (this.keys[37]) {
      this.playerXV = -0.15
    }

    if (this.playerOnGround && this.keys[32]) {
      console.log('boing!')
      this.playerYV = -0.3
    }
  }

  get playerOnGround() {
    const rows = this.activeLevel.tiles.split('\n')
    const rowBelow = rows[Math.floor(this.playerY) + 1]
    return rowBelow && (
      rowBelow[Math.floor(this.playerX)] === '=' ||
      rowBelow[Math.ceil(this.playerX)] === '='
    )
  }

  doMovement() {
    if (this.playerOnGround) {
      // If the player isn't moving up (e.g. jumping), set the player's Y
      // velocity to 0.
      if (this.playerYV > 0) {
        this.playerYV = 0
      }

      // Move the player to the top of the block they're currently standing on.
      // This will probably need to be removed in the future to deal with
      // sloped blocks, but that's all complicated and lovely stuff that we
      // aren't going to be dealing with for now! :)
      this.playerY = Math.floor(this.playerY)
    } else {
      this.playerYV += 0.01
    }

    this.playerXV *= 0.8
    this.playerX += this.playerXV
    this.playerY += this.playerYV
  }
}

module.exports = SLW
