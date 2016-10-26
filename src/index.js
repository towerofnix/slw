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

      game.inputMovement()
      game.doMovement()
    })()
  }

  tileset.src = 'tileset.png'
})
