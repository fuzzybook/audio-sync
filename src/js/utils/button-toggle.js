'use strict'
import EventEmitter from './eventEmitter.js'
export default class ButtonToggle extends EventEmitter {
  constructor(domNode, text, css, icon, icon2) {
    super()
    this._selected = false
    this._btn = document.createElement('div')
    this._btn.classList.add('mat-btn')
    this._btn.classList.add('show')
    if (css) this._btn.classList.add(css)
    domNode.appendChild(this._btn)
    this._html = '<span>'
    if (icon) this._html += `<i class="material-icons icon1">${icon}</i><i class="material-icons icon2">${icon2}</i>`
    if (text) this._html += `<i class="material-text">${text}</i>`
    this._html += '</span>'
    this._btn.innerHTML = this._html
    let self = this
    this._btn.addEventListener('click', e => {
      self._selected = !self._selected
      if (self._selected) {
        self._btn.classList.add('selected')
      } else {
        self._btn.classList.remove('selected')
      }
      this.emit('change', self._selected, e.shiftKey, e.altKey)
    })
  }
  visible(mode) {
    if (mode) {
      this._btn.classList.add('show')
    } else {
      this._btn.classList.remove('show')
    }
  }
  get selected() {
    return this._selected
  }

  setState(selected) {
    // console.log('selected', selected)
    this._selected = selected
    if (this._selected) {
      this._btn.classList.add('selected')
    } else {
      this._btn.classList.remove('selected')
    }
  }
  set selected(selected) {
    this._selected = selected
    if (this._selected) {
      this._btn.classList.add('selected')
    } else {
      this._btn.classList.remove('selected')
    }
  }
}