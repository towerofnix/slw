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

    this.playerX = 0
    this.playerY = 0
    this.playerXV = 0
    this.playerYV = 0

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
    const [pRendX, pRendY] = [this.playerX, this.playerY]
    ctx.fillRect(pRendX, pRendY, 16, 32)

    console.log(
      // 'Looped tiles:', (viewEndX - viewStartX) * (viewEndY - viewStartY)
    )
  }

  inputMovement() {
    // x-input

    if (this.keys[39]) {
      if(this.playerXV <= 0.5) this.playerXV += 0.1
    }

    if (this.keys[37]) {
      if(this.playerXV >= -0.5) this.playerXV -= 0.1
    }

    this.playerXV = this.playerXV * 0.75

    // y-input

    if (this.keys[38]) {
      this.playerYV -= 1
    }

    this.playerYV += 0.5
  }

  doMovement() {
    const rows = this.activeLevel.tiles.split('\n')
    let edge

    // x-movement
    if (this.playerXV > 0) edge = this.playerX
    if (this.playerXV < 0) edge = this.playerX + this.tileSize
    if (this.playerXV !== 0) {
      /*
      let intersects = Math.ceil((edge + this.playerXV) / 16)
      let last = (edge + this.playerXV) % 16 // TODO?
      let newPosition = this.playerX

      for(let i = 0; i < intersects; i++) {
        let tile = rows[this.playerY][i]

        if(tile === '-') {
          // TODO use a collision map
          newPosition += 1//this.tileSize
        }
      }

      console.log(this.playerX)

      this.playerX = newPosition + last
      */

      this.playerX += this.playerXV
    }

    // y-movement
    if (this.playerYV > 0) edge = this.playerY
    if (this.playerYV < 0) edge = this.playerY + this.tileSize
    if (this.playerYV !== 0) {
      let intersects = Math.ceil((edge + this.playerYV) / 16)
      let last = (edge + this.playerYV) % 16 // TODO?
      let i

      for(i = Math.floor(this.playerY); i < this.playerY + intersects; i++) {
        let tile = rows[i][Math.floor(this.playerX)]

        if(tile !== '-') {
          break
        }
      }

      this.playerY = i //* this.tileSize
    }
  }
}

module.exports = SLW
