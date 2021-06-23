import Cursor from './cursorClass'
import Label from './labelClass'
export default class Thumb {
  constructor() {
    this._thumb = document.createElement('div')
    this._thumb.classList.add('thumb')
    this._thumb.setAttribute('ref', 'thumb')
    this._thumb.setAttribute('tabindex', '0')
    this._thumb.setAttribute('aria-valuenow', '0')
    // ring aestethic element
    let ring = document.createElement('div')
    ring.classList.add('ring')
    this._thumb.appendChild(ring)
    this._cursor = new Cursor()
    this._thumb.appendChild(this._cursor)
    this._label = new Label()
    this._thumb.appendChild(this._label.el)
  }
  appendChild (el) {
    this._thumb.appendChild(el)
  }
  get el () {
    return this._thumb
  }
  set label (text) {
    this._label.text = text
  }
  get label () {
    return this._label.text
  }
  moved (min, max, pos) {
    this._label.moved(min, max, pos, this._thumb.clientWidth)
  }
}