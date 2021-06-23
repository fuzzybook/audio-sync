'use strict'
import BtnToggle from '../utils/button-toggle'
export default class {
  constructor(domNode, css, id) {
    this._id = id
    this._row = document.createElement('div')
    this._row.classList.add(css)
    domNode.appendChild(this._row)

    this._leftBox = document.createElement('div')
    this._leftBox.classList.add('left-box')
    this._row.appendChild(this._leftBox)

    this._vumeter = document.createElement('canvas')
    this._vumeter.classList.add('vu-meter')
    this._vumeter.setAttribute('id', 'vu-meter-' + id)
    this._leftBox.appendChild(this._vumeter)

    this._rightBox = document.createElement('div')
    this._rightBox.classList.add('right-box')
    this._row.appendChild(this._rightBox)

    let mute = new BtnToggle(this._rightBox, null, 'mute', 'volume_up', 'volume_off')
    mute.on('change', selected => {
      console.log('change mute', selected, new Date().getTime())
      window.SquyncEditor.globals.emit('mute-btn', this._id, selected)
    })

    let solo = new BtnToggle(this._rightBox, null, 'solo', 'radio_button_unchecked', 'radio_button_checked')
    solo.on('change', selected => {
      window.SquyncEditor.globals.emit('solo-btn', this._id, selected)
    })
    const soloHandler = (id, state) => {
      if (id === this._id && !state) {
        solo.selected = state
      }
    }
    window.SquyncEditor.globals.on('solo-selected', soloHandler.bind(this))

    const mutedHandler = (id, state) => {
      if (id === this._id && !state) {
        mute.selected = state
      }
    }
    window.SquyncEditor.globals.on('muted-selected', mutedHandler.bind(this))
  }

  get vuMeter() {
    return this._vumeter
  }
}
