'use strict'
import EventEmitter from '../utils/eventEmitter.js'
import Fader from './fader'
import Btn from '../utils/button'
import { render } from '../utils/dom'
export default class MixerPopUp extends EventEmitter {
  constructor() {
    super()
    let mixer = document.getElementById('mixer')
    if (mixer) {
      while (mixer.firstChild) {
        mixer.removeChild(mixer.firstChild)
      }
    } else {
      var body = document.getElementsByTagName('BODY')[0]
      let div = document.createElement('div')
      div.id = 'mixer'
      body.prepend(div)
    }

    this._name = 'mixer'
    this._status = {
      locked: false
    }
    this._menu = document.createElement('div')
    this._menu.id = 'mixer-popup-box'
    this._menu.classList.add('mixer-popup-box')
    this._menu.classList.add('disabled')

    this._mixerList = null
    this._deleteBox = null

    this._index = -1
    this._id = null
    this._visible = false

    this._menu.addEventListener('click', event => {
      event.preventDefault()
      event.stopPropagation()
    })

    this.buildHeader()

    let deleteBtn = new Btn(this._deleteBox, null, 'delete', 'delete')
    deleteBtn.on('click', () => {
      window.SquyncEditor.globals.emit('volume-delete', this._index, this._id)
    })

    this._fader = new Fader(this._mixerList)

    this._fader.on('change', value => {
      this._valueBox.innerHTML = parseInt(Math.abs(1 - value) * 100) + '%'
      window.SquyncEditor.globals.emit('fader-volume-change', this._index, this._id, value)
    })

    this._fader.on('disabled', value => {
      if (value) {
        this._menu.classList.add('disabled')
      } else {
        this._menu.classList.remove('disabled')
      }
    })

    this._mixerList.addEventListener('mousedown', event => {
      event.preventDefault()
      event.stopPropagation()
    })

    document.getElementById('mixer').appendChild(this._menu)
    //popupBG.insert(this._menu)

    window.SquyncEditor.globals.on('volume-selection', (point, id) => {
      //console.log('volume-selection', point)
      this._index = point.index
      this._id = id
      this._fader.value = point.value
      this._valueBox.innerHTML = parseInt(Math.abs(1 - point.value) * 100) + '%'
    })

    window.SquyncEditor.globals.on('volume-change', (point, id, value) => {
      //console.log('volume-change', value)
      this._index = point.index
      this._id = id
      this._fader.value = value
      this._valueBox.innerHTML = parseInt(Math.abs(1 - value) * 100) + '%'
    })

    window.SquyncEditor.globals.on('volume-canvas', show => {
      if (!show && this._menu.classList.contains('show')) {
        this._menu.classList.remove('show')
      }
    })

    window.SquyncEditor.globals.on('new-popup', name => {
      if (name !== this._name) {
        this._menu.classList.remove('show')
        window.SquyncEditor.globals.emit('volume-canvas', false)
      }
    })
  }

  get status() {
    return this._status
  }

  buildHeader() {
    let { mixerList, commandBox, deleteBox, valueBox } = render(
      this._menu,
      `
      <div editor-ref="commandBox">
        <div editor-ref="valueBox"></div>
        <div editor-ref="deleteBox"></div>
      </div>
      <div editor-ref="mixerList">
      </div>
      <div class="triangle"><div>
    `
    )
    this._mixerList = mixerList
    this._commandBox = commandBox
    this._valueBox = valueBox
    this._deleteBox = deleteBox
  }

  getRelativeMousePosition(event) {
    let target = event.target
    var rect = target.getBoundingClientRect()

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  }

  show(event) {
    this._menu.style.left = '-300px'
    if (this._menu.classList.contains('show')) {
      window.SquyncEditor.globals.emit('volume-canvas', false)
    } else {
      this._menu.classList.add('show')
      window.SquyncEditor.globals.emit('select-track', -1)
      setTimeout(() => {
        //console.log(event.target.getBoundingClientRect(), this._menu.getBoundingClientRect())
        let r = event.target.getBoundingClientRect()
        let centerX = r.x - this._menu.clientWidth / 2 + r.width / 2
        let centerY = r.y - this._menu.clientHeight - 20
        this._menu.style.left = centerX + 'px'
        this._menu.style.top = centerY + 'px'
        window.SquyncEditor.globals.emit('volume-canvas', true)
        window.SquyncEditor.globals.emit('new-popup', this._name)
      }, 100)
    }
  }
}
