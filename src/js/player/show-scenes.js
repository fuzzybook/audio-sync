'use strict'
import EventEmitter from '../utils/eventEmitter.js'
import { render } from '../utils/dom'
import Alert from '../utils/alert'
import popupBG from '../utils/popup-background'
export default class ShowScenesPopUp extends EventEmitter {
  constructor() {
    super()
    this._name = 'scenes'
    this._status = {
      locked: false
    }
    this._scenesList = null
    this._menu = document.createElement('div')
    this._menu.id = 'scenes-popup-box'
    this._menu.classList.add('scenes-popup-box')
    popupBG.insert(this._menu)

    /* this._menu.addEventListener('click', event => {
      event.preventDefault()
      event.stopPropagation()
    }) */

    const rebuildList = () => {
      this.buildList()
    }
    window.SquyncEditor.globals.on('change-scenes', rebuildList.bind(this))
  }

  get status() {
    return this._status
  }

  addItem(item) {
    let root = document.createElement('div')
    root.classList.add('item')
    let { scenesListItem, sceneRemove } = render(
      root,
      `
      <div editor-ref="scenesListItem">
      <div editor-ref="scenesHeaderImgBox">
          <img editor-ref="scenesHeaderImg" src="${item.img}"/>
        </div>
        <div editor-ref="scenesHeaderText">
          <div editor-ref="scenesHeaderTitle">${item.title}</div>
          <div editor-ref="scenesHeaderTime">${window.SquyncEditor.zoom.timeToMin(item.pos)}</div>
          <div editor-ref="sceneRemove">
            <i class="material-icons">delete_outline</i>
          </div>
        </div>
      </div>
    `
    )
    const clickHandler = item => {
      this._menu.classList.remove('show')
      window.SquyncEditor.globals.emit('set-scene-position', item.pos)
    }
    scenesListItem.addEventListener('click', () => clickHandler(item))

    const sceneRemoveHandler = event => {
      event.preventDefault()
      event.stopPropagation()
      window.SquyncEditor.globals.emit('remove-scene', item)
    }
    sceneRemove.addEventListener('click', sceneRemoveHandler.bind(this))

    this._scenesList.appendChild(root)
  }

  buildList() {
    let { scenesList, header, btnClose } = render(
      this._menu,
      `
      <div editor-ref="scenesListHeader">
        <div editor-ref="Header">
        <div>SCENES</div>
        <div editor-ref="btnClose"><i class="material-icons">close</i></div>
        </div>
        <div editor-ref="scenesList">
        
        </div>
      </div>
    `
    )
    this._header = header
    this._scenesList = scenesList
    if (window.SquyncEditor.videoStore.scenes) {
      window.SquyncEditor.videoStore.scenes.map(scene => {
        this.addItem(scene)
      })
    }
    btnClose.addEventListener('click', event => {
      event.preventDefault()
      event.stopPropagation()
      this._menu.classList.remove('show')
      popupBG.hide()
    })
  }

  show(event) {
    event.preventDefault()
    window.SquyncEditor.globals.emit('new-popup', this._name)
    if (window.SquyncEditor.videoStore.scenes.length === 0) {
      Alert.show('No Scenes!', 'Please insert scenes.')
    } else {
      if (!window.SquyncEditor.globals.playing) {
        this.buildList()
        this._menu.classList.add('show')
        popupBG.show()
      }
    }
  }
}
