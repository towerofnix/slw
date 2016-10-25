// @flow

const SLW = require('./slw')

window.addEventListener('load', e => {
  let tileset = new Image

  tileset.onload = () => {
    const game = new SLW
    document.body.appendChild(game.canvas)

    game.tileset = tileset
    game.canvas.focus()

    !(function render() {
      requestAnimationFrame(render)
      game.canvasClear()
      game.drawLevelTiles()

      if (game.keys[39]) {
        game.playerX += 0.1
      }

      if (game.keys[37]) {
        game.playerX -= 0.1
      }

      if (game.keys[38]) {
        game.playerY -= 0.1
      }

      if (game.keys[40]) {
        game.playerY += 0.1
      }

      console.log(game)
    })()
  }

  tileset.src = 'tileset.png'
})
