'use strict'
import EventEmitter from '../utils/eventEmitter.js'
import Alert from '../utils/alert'
import popupBG from '../utils/popup-background'
import ScenesHeader from './scenes-header'
export default class ShowScenesDialog extends EventEmitter {
  constructor() {
    super()
    this._status = {
      locked: false
    }
    this._scenesList = null

    this._dialog = document.createElement('div')
    this._dialog.id = 'scenes-dialog-box'
    this._dialog.classList.add('scenes-dialog-box')
    popupBG.insert(this._dialog)
    this._scenesHeader = new ScenesHeader(this._dialog)
    const closeHandle = () => {
      this._dialog.classList.remove('show')
      popupBG.hide()
    }
    this._scenesHeader.on('close', closeHandle.bind(this))

    this._dialog.addEventListener('click', event => {
      event.preventDefault()
      event.stopPropagation()
    })
  }

  show() {
    if (!window.SquyncEditor.videoStore.videoPresent) {
      Alert.show('No Movie!', 'Please load a movie before insert scenes.')
    } else {
      if (!window.SquyncEditor.globals.playing) {
        this._scenesHeader.clearInput()
        this._scenesHeader.image = window.SquyncEditor.videoStore.snapImage()
        this._dialog.classList.add('show')
        popupBG.show()
        this._scenesHeader.focus = true
      }
    }
  }
}