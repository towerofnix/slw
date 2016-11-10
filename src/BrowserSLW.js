// @flow

import SLW from './SLW'
import Tile from './Tile'
import { crop } from './util'

// Browser editor for SLW levels.
export default class BrowserSLW {
  header: HTMLElement

  game: SLW

  constructor(game: SLW) {
    this.game = game
    this.header = document.getElementById('header')

    // Editor toggle -----------------------
    const editorToggle = this.addToggle(class extends Toggle {
      onCreate() {
        this.setTitle('Editor Mode')
        this.setChecked(false)
        this.setDisabled(true)
      }

      onCheckedCanged() {
        const el = document.getElementById('toolbar')
        if (this.checked) {
          /*
          let tiles = [ '=', '-', '?', 'x', '~', 'C', 'P', '0' ]
          let tileEls: Array <Image> = []

          for (let tileid of tiles) {
            const tile = new (Tile.get(tileid))(game)

            let img = crop(game.level.tileset, Tile.size, Tile.size, tile.texPosition[0] * Tile.size, tile.texPosition[1] * Tile.size)
            img.classList.add('tile')

            img.addEventListener('click', evt => {
              for (let tileEl of tileEls) tileEl.classList.remove('selected')

              img.classList.add('selected')
              game.tileToPaint = Tile.get(tileid)
            })

            tileEls.push(img)
            el.appendChild(img)
          }

          tileEls[0].click()
          */
        } else {
          el.innerHTML = ''
        }

        game.level.editorEnabled = this.checked
      }
    })

    game.events.addEventListener('levelchanged', ({ level }) => {
      if (level.meta.special.includes('world')) {
        editorToggle.setDisabled(true)
      } else {
        editorToggle.setDisabled(false)
      }
    })

    // Gamepad toggle ----------------------
    this.addToggle(class extends Toggle {
      onCreate() {
        this.setTitle('Gamepad')
        this.load('gamepad-support')

        if (!game.gamepadSupport) {
          this.setDisabled(true)
        }
      }

      onDestroy() {
        this.save('gamepad-support')
      }

      onCheckedChanged() {
        game.gamepadEnabled = this.checked
      }
    })
  }

  // Add a global toggle control.
  addToggle(toggleClass: Class<Toggle>) {
    const toggle = new toggleClass()

    const toggles = this.header.querySelector('#toggles')
    toggles.appendChild(toggle.btn)

    return toggle
  }
}

class Toggle {
  checked: boolean
  disabled: boolean

  btn: HTMLElement

  constructor() {
    this.btn = document.createElement('button')

    this.btn.addEventListener('click', () => {
      this.setChecked(!this.checked)
    })

    this.onCreate()

    window.addEventListener('beforeunload', () => {
      this.onDestroy()
    })
  }

  setChecked(newChecked: boolean) {
    this.checked = newChecked
    if (this.checked) {
      this.btn.classList.add('checked')
      this.btn.classList.remove('unchecked')
    } else {
      this.btn.classList.remove('checked')
      this.btn.classList.add('unchecked')
    }

    this.onCheckedChanged()
  }

  setDisabled(newDisabled: boolean) {
    this.disabled = newDisabled
    if (newDisabled) {
      this.btn.setAttribute('disabled', 'true')
    } else {
      this.btn.removeAttribute('disabled')
    }
  }

  setTitle(newTitle: string) {
    while (this.btn.firstChild) {
      this.btn.removeChild(this.btn.firstChild)
    }

    this.btn.appendChild(document.createTextNode(newTitle))
  }

  load(key: string) {
    if (localStorage['toggle-' + key] === 'true') {
      this.setChecked(true)
    } else {
      this.setChecked(false)
    }
  }

  save(key: string) {
    localStorage['toggle-' + key] = this.checked.toString()
  }

  onCreate() {}
  onCheckedChanged() {}
  onDestroy() {}
}
