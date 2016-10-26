// @flow

import SLW from './slw'

window.addEventListener('load', e => {
  let tileset = new Image

  tileset.onload = () => {
    const game = new SLW
    window.game = game
    document.body.appendChild(game.canvas)

    game.tileset = tileset
    game.canvas.focus()

    let didTick = false

    !(function render() {
      requestAnimationFrame(render)

      // if (game.keys[32]) {
      //   if (!didTick) {
          game.canvasClear()
          game.drawLevelTiles()

          game.inputMovement()
          game.doMovement()
      //     didTick = true
      //   }
      // } else {
      //   didTick = false
      // }
    })()
  }

  tileset.src = 'tileset.png'
})
