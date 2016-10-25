// @flow

const SLW = require('./slw')

window.addEventListener('load', e => {
  const game = new SLW()
  document.body.appendChild(game.canvas)

  game.drawLevelTiles()
})
