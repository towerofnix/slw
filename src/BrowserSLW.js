// @flow

import SLW from './SLW'

// Browser editor for SLW levels.
export default class BrowserSLW {
  header: HTMLElement

  game: SLW

  constructor() {
    this.header = document.getElementById('header')

    // Editor toggle -----------------------
    this.addToggle(class extends Toggle {
      onCreate() {
        this.setChecked(false)
        this.setDisabled(true)
      }

      onCheckedChanged() {
        if (this.checked) {
          this.setTitle('Editor ON')
        } else {
          this.setTitle('Editor OFF')
        }
      }
    })

    // Gamepad toggle ----------------------
    this.addToggle(class extends Toggle {
      onCreate() {
        this.setChecked(false)
      }

      onCheckedChanged() {
        if (this.checked) {
          this.setTitle('Gamepad ON')
        } else {
          this.setTitle('Gamepad OFF')
        }
      }
    })
  }

  // Add a global toggle control.
  addToggle(toggleClass: Class<Toggle>) {
    const toggles = this.header.querySelector('#toggles')

    const toggle = new toggleClass()

    toggles.appendChild(toggle.btn)
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
    this.btn.setAttribute('disabled', newDisabled.toString())
  }

  setTitle(newTitle) {
    while (this.btn.firstChild) {
      this.btn.removeChild(this.btn.firstChild)
    }

    this.btn.appendChild(document.createTextNode(newTitle))
  }

  onCreate() {}
  onCheckedChanged() {}
}
