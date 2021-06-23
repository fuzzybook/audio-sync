import EventEmitter from '../utils/eventEmitter.js'

export default class Grip extends EventEmitter {
  constructor(domNode, min, max, pos, cssclass) {
    super()
    // create nodes
    // --console.log(domNode,min, max, pos, cssclass)
    this._domNode = domNode
    this._min = min
    this._max = max
    this._pos = pos
    this._posTime = 0
    this._gripNode = document.createElement('div')
    this._gripNode.classList.add('grip-box')

    this._gripNode.style.left = this._pos + 'px'
    domNode.appendChild(this._gripNode)

    this._handleNode = document.createElement('div')
    this._handleNode.classList.add('grip-handle')
    this._handleNode.classList.add('pos-' + cssclass)
    this._gripNode.appendChild(this._handleNode)
    this._cursor = document.createElement('div')
    this._cursor.classList.add('cursor')
    this._handleNode.appendChild(this._cursor)

    // events
    this._gripNode.addEventListener('mousedown', this.handleMouseDown.bind(this))
  }

  destroy() {
    this._domNode.removeChild(this._gripNode)
  }

  // event mouse down
  handleMouseDown(event) {
    event.preventDefault()
    event.stopPropagation()
    var self = this
    let x = event.pageX
    let p = self._pos
    self.emit('mousedown')
    self._gripNode.classList.add('down')
    self._handleNode.classList.add('down')
    var handleMouseMove = function (event) {
      var newPos = event.pageX - x + p
      if (newPos < self._min) {
        newPos = self._min
      }
      self.move(newPos)
      self.emit('move', newPos)
    }
    var handleMouseUp = function () {
      self.emit('change', self._pos)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      self._gripNode.classList.remove('down')
      self._handleNode.classList.remove('down')
    }
    // bind a mousemove event handler to move pointer
    document.addEventListener('mousemove', handleMouseMove)
    // bind a mouseup event handler to stop tracking mouse movements
    document.addEventListener('mouseup', handleMouseUp)
    // Set focus to the clicked handle
  }
  get pos() {
    return this._pos
  }
  set pos(pos) {
    this._pos = pos
    this._gripNode.style.left = pos + 'px'
  }
  set selected(value) {
    if (value) {
      this._gripNode.classList.add('selected')
    } else {
      this._gripNode.classList.remove('selected')
    }
  }
  set disable(value) {
    if (value) {
      this._gripNode.classList.add('disabled')
    } else {
      this._gripNode.classList.remove('disabled')
    }
  }
  // move to pos
  move(pos) {
    if (pos < this._min) {
      pos = this._min
    }
    if (pos > this._max) {
      pos = this._max
    }
    if (pos > window.SquyncEditor.config.rowsContainer.clientWidth - 10) {
      pos = window.SquyncEditor.config.rowsContainer.clientWidth - 10
    }
    this._pos = pos
    this._gripNode.style.left = pos + 'px'
  }
  // set bounds
  setBounds(min, max, pos) {
    this._min = min
    this._max = max
    this.move(pos)
  }
}