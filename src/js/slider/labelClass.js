export default class Label {
  constructor() {
    this.thumbWidth =
      this._labelNode = document.createElement('div')
    this._labelNode.classList.add('label')
    this._labelNode.setAttribute('ref', 'label')

    this._dot = document.createElement('div')
    this._dot.classList.add('label-dot')
    this._labelNode.appendChild(this._dot)

    this._labelText = document.createElement('span')
    this._labelNode.appendChild(this._labelText)
    this._labelText.innerHTML = '00:00.00'
    this._text = '00:00'
  }
  get el() {
    return this._labelNode
  }
  get text() {
    return this._text
  }
  set text(text) {
    this._text = text
    this._labelText.innerHTML = text
  }
  // thumb is moving bound detection an align
  moved(min, max, pos, tw) {
    let twh = Math.ceil(tw / 2) // half thumb width
    let right = max - pos
    let w = Math.ceil(this._labelNode.clientWidth / 2)
    // w === 0 start option
    if (pos + twh < w || w === 0) {
      this._labelNode.style.left = -pos + 'px'
      this._dot.style.left = twh + pos + 'px'
    } else if (right + twh < w) {
      this._labelNode.style.left = (-this._labelNode.clientWidth + right) + tw + 'px'
      this._dot.style.left = (this._labelNode.clientWidth - right) - twh + 'px'
    } else {
      this._labelNode.style.left = -w + 11 + 'px'
      this._dot.style.left = w + 'px'
    }
  }
}