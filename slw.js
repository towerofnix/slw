// SUPER LIAM WORLD(tm)
// totally not stolen from an-ok-squirrel.
// this is a fair use of the name as specified
// in NANALAND RULES NUMBER #99

class SLW {
  constructor() {
    this.canvas = document.createElement('canvas')

    this.playerX = 0
    this.playerY = 0

    this.activeLevel = {
      tiles: (
        '************\n'+
        '************\n'+
        '************\n'+
        '*******DDDDD\n'+
        'DDDDD*****D*'
      )
    }
  }

  drawLevelTiles() {
    const ctx = this.canvas.getContext('2d')

    const rows = this.activeLevel.tiles.split('\n')
    let viewStartX = this.playerX - 5
    let viewStartY = this.playerY - 5
    let viewEndX = viewStartX + 10
    let viewEndY = viewStartY + 10
    viewStartX = Math.max(viewStartX, 0)
    viewStartY = Math.max(viewStartY, 0)
    viewEndX = Math.max(viewEndX, 0)
    viewEndY = Math.max(viewEndY, 0)

    for (let y = viewStartY; y < viewEndY; y++) {
      for (let x = viewStartX; x < viewEndX; x++) {
        let row = rows[y] || ''
        let tile = row[x] || ''
        console.log(x, y, tile)

        if (tile === 'D') {
          ctx.fillRect(x * 30, y * 30, 30, 30)
        }
      }
    }
  }
}
