import SLW from './SLW'

window.addEventListener('load', e => {
  let tileset = new Image

  tileset.onload = () => {
    const game = new SLW(
`--------------------
 --------------------
 --------------------
 --------------------
 ----------------===-
 --------------------
 --------------------
 --------===---------
 --------------------
 ==------------------
 --------------------
 =??-------=?=-------
 ------=-------------
 -----===------------
 ----=====----===----
 =================---
 ====================`, tileset)

    window.game = game // debug only pls
    document.body.appendChild(game.canvas)

    game.tileset = tileset
    game.canvas.focus()

    let didTick = false

    !(function render() {
      requestAnimationFrame(render)

      if(document.hasFocus()) { // don't update if we're in devtools
        game.canvasClear()

        game.level.update()
        game.level.draw()

        game.player.update(game)
        game.player.draw(game)
      }
    })()
  }

  tileset.src = 'tileset.png'
})
