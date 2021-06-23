'use strict'
import EventEmitter from './eventEmitter.js'
export default class Button extends EventEmitter {
  constructor(domNode, text, css, icon, icon_png = false) {
    super()
    this._btn = document.createElement('div')
    this._btn.classList.add('mat-btn')
    this._btn.classList.add('show')
    if (css) this._btn.classList.add(css)
    domNode.appendChild(this._btn)

    if (icon_png) {
      this._img = document.createElement('img')
      this._img.setAttribute('src', icon)
      this._btn.appendChild(this._img)
    } else {
      this._html = '<span>'
      if (icon) this._html += `<i class="material-icons icon1">${icon}</i>`
      if (text) this._html += `<i class="material-text">${text}</i>`
      this._html += '</span>'
      this._btn.innerHTML = this._html
    }

    this._btn.addEventListener('click', event => {
      if (!this._btn.classList.contains('not-enabled')) {
        this.emit('click', event)
      }
    })
  }
  visible(mode) {
    if (mode) {
      this._btn.classList.add('show')
    } else {
      this._btn.classList.remove('show')
    }
  }
  set disabled(disabled) {
    if (disabled) {
      this._btn.classList.add('not-enabled')
    } else {
      this._btn.classList.remove('not-enabled')
    }
  }
  get disabled() {
    return this._btn.classList.contains('not-enabled')
  }
}
