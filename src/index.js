import SLW from './SLW'
import controller from './controls/controller'

window.addEventListener('load', e => {
  const main = document.getElementById('main')

  let tileset = new Image

  const game = new SLW('F-1', tileset)

  window.game = game // debug only pls

  // Prepend the game canvas, so that it's below the controller
  main.insertBefore(game.canvas, main.firstChild)

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
      game.entityUpdate()

      game.canvasClear()
      game.draw()
    }
  })()

  tileset.src = 'tileset.png'

  // Controller ------------------------------
  controller({
    buildTarget: document.getElementById('controller'),
    eventTarget: game.canvas,
    disableZoom: true
  })

  main.addEventListener('touchmove', evt => {
    evt.preventDefault()
  })
})
