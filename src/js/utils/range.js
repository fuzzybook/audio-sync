'use strict'
import EventEmitter from './eventEmitter.js'
export default class Range extends EventEmitter {
  constructor(domNode, css, min, max) {
    super()
    this._value = .5
    this._range = document.createElement('div')
    this._range.classList.add('mat-range')
    if (css) this._range.classList.add(css)
    domNode.appendChild(this._range)

    this._input = document.createElement('input')
    this._input.setAttribute('type', 'range')
    this._input.setAttribute('step', '1')
    this._input.setAttribute('min', min)
    this._input.setAttribute('max', max)
    this._range.appendChild(this._input)
    this._input.value = 50
    this._input.addEventListener('change', () => {
      this._value = this._input.value
      this.emit('change', this._value)
    })
    this._input.addEventListener('input', () => {
      this._value = this._input.value
      this.emit('change', this._value)
    })

  }
  get value() {
    return this._value
  }
  set value(value) {
    this._value = value
    this._input.value = value
  }
}