import SLW from './SLW'

window.addEventListener('load', e => {
  let tileset = new Image

  tileset.onload = () => {
    const game = new SLW('F', tileset)

    window.game = game // debug only pls
    document.body.appendChild(game.canvas)

    game.tileset = tileset
    game.canvas.focus()

    let didTick = false

    !(function render() {
      game.gamepadInput()

      if(document.hasFocus()) { // don't update if we're in devtools
        // Very deliberate order:
        game.player.update()
        game.cameraUpdate()
        game.level.update()
        game.entityUpdate()

        game.canvasClear()
        game.draw()
      }

      requestAnimationFrame(render)
    })()
  }

  tileset.src = 'tileset.png'
})
