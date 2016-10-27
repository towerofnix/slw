import SLW from './SLW'

window.addEventListener('load', e => {
  let tileset = new Image
  let entity_tileset = {}

  tileset.onload = () => {
    if (!(Object.keys(entity_tileset).every(img => entity_tileset[img].complete))) {
      requestAnimationFrame(tileset.onload);
      return;
    }
    const game = new SLW('1-1', tileset, entity_tileset)

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
        game.entityUpdate()

        game.canvasClear()
        game.draw()
      }
    })()
  }

  entity_tileset.Player new Image
  entity_tileset.Player.src = 'liam.png'
  tileset.src = 'tileset.png'
})
