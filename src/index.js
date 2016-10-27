import SLW from './SLW'

window.addEventListener('load', e => {
  let tileset = new Image

  tileset.onload = () => {
    const game = new SLW('1-1', tileset)

    window.game = game // debug only pls
    document.body.appendChild(game.canvas)

    game.tileset = tileset
    game.canvas.focus()

    let didTick = false

    !(function render() {
      requestAnimationFrame(render)

      if(document.hasFocus()) { // don't update if we're in devtools
        // Very deliberate order:
        game.player.update()
        game.cameraUpdate()
        game.level.update()

        game.canvasClear()
        game.draw()
      }
    })()
  }

  tileset.src = 'tileset.png'
})
