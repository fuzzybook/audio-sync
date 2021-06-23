import Thumb from './thumbClass.js'
import EventEmitter from '../utils/eventEmitter.js'

export default class Slider extends EventEmitter {
  constructor(domNode) {
    super()
    let self = this
    // create nodes
    this.thumb = new Thumb()
    this._thumb = this.thumb.el
    // rail space to move thumb
    this._railDomNode = document.createElement('div')
    this._railDomNode.classList.add('rail')
    this._railDomNode.appendChild(this._thumb)
    domNode.appendChild(this._railDomNode)

    this._domNode = this._thumb
    this._valueMin = 0
    this._railWidth = 0
    this._thumbWidth = this._thumb.clientWidth
    this._thumbHeight = this._thumb.clientHeight
    this._keyCode = Object.freeze({
      left: 37,
      up: 38,
      right: 39,
      down: 40,
      tab: 9
    })
    this._isOverflow = 0

    // overflow call back
    const step = () => {
      if (self._isOverflow !== 0) {
        self.emit('overflow', self._isOverflow)
      }
      window.requestAnimationFrame(step)
    }
    window.requestAnimationFrame(step)

    // set values
    this._valueNow = 0
    this._valueMax = parseInt(this._railDomNode.clientWidth)
    this._railWidth = parseInt(this._railDomNode.clientWidth)
    this.moveSliderTo(this._valueNow)
    // set tab index
    if (this._thumb.tabIndex != 0) {
      this._thumb.tabIndex = 0
    }
    // events
    this._thumb.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this._thumb.addEventListener('mouseenter', this.handleMouseEnter.bind(this))
    this._thumb.addEventListener('mouseup', this.handleMouseUp.bind(this))

    window.SquyncEditor.globals.on('keydown', event => {
      self.handleKeyDown(event)
    })

    window.SquyncEditor.sizes.on('resized', () => {
      self._valueMax = parseInt(self._railDomNode.clientWidth)
      self._railWidth = parseInt(self._railDomNode.clientWidth)
    })
  }

  // add text to label
  setLabel(label) {
    this.thumb.label = label
  }
  // move slider
  moveSliderTo(value) {
    this._isOverflow = 0
    if (value > this._valueMax) {
      value = this._valueMax
      this._isOverflow = 1
    }
    if (value < this._valueMin) {
      value = this._valueMin
      this._isOverflow = -1
    }
    this._valueNow = value
    this._thumb.setAttribute('aria-valuenow', value)
    var pos = value - this._thumbWidth / 2
    this._thumb.style.left = pos + 'px'
    this.emit('changed', this._valueNow, this._valueNow / (this._valueMax / 100.0))
    this.thumb.moved(this._valueMin, this._valueMax, this._valueNow)
  }

  // key down event
  handleKeyDown(event) {
    if (event.altKey) {
      switch (event.keyCode) {
        case this._keyCode.left:
          this.moveSliderTo(this._valueNow - 1)
          break

        case this._keyCode.right:
          this.moveSliderTo(this._valueNow + 1)
          break

        case this._keyCode.down:
          this.moveSliderTo(this._valueNow - 10 - (this._valueNow % 10))
          break

        case this._keyCode.up:
          this.moveSliderTo(this._valueNow + 10 - (this._valueNow % 10))
          break
      }
    }
  }
  // event mouse down
  handleMouseUp() {
    window.SquyncEditor.globals.emit('position-up')
  }
  handleMouseEnter() {
    this.thumb.moved(this._valueMin, this._valueMax, this._valueNow)
  }
  handleMouseDown(event) {
    event.preventDefault()
    event.stopPropagation()
    var self = this
    let r = this._railDomNode.getBoundingClientRect()
    self.emit('mousedown')
    self._railDomNode.parentNode.classList.add('down')
    var handleMouseMove = function (event) {
      event.preventDefault()
      event.stopPropagation()
      // -9 margin adjust
      var diffX = event.pageX - r.x
      self._valueNow = parseInt(((self._valueMax - self._valueMin) * diffX) / self._railWidth)
      self.moveSliderTo(diffX)
    }
    var handleMouseUp = function () {
      event.preventDefault()
      event.stopPropagation()
      self.emit('mouseup')
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      self._railDomNode.parentNode.classList.remove('down')
      self.emit('changed', self._valueNow, 0, self._valueNow / (self._valueMax / 100.0))
      self._isOverflow = 0
    }
    // bind a mousemove event handler to move pointer
    document.addEventListener('mousemove', handleMouseMove)
    // bind a mouseup event handler to stop tracking mouse movements
    document.addEventListener('mouseup', handleMouseUp)
    event.preventDefault()
    event.stopPropagation()
    // Set focus to the clicked handle
    this._thumb.focus()
  }
}