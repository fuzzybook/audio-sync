'use strict'
import EventEmitter from '../utils/eventEmitter.js'
import { render } from '../utils/dom'
import Alert from '../utils/alert'
import popupBG from '../utils/popup-background'
export default class ShowTracksPopUp extends EventEmitter {
  constructor() {
    super()
    this._name = 'tracks'
    this._status = {
      locked: false
    }
    this._tracksList = null
    this._alertNoTacks = null
    this._menu = document.createElement('div')
    this._menu.id = 'popup-track-box'
    this._menu.classList.add('popup-track-box')
    popupBG.insert(this._menu)

    this._menu.addEventListener('click', event => {
      event.preventDefault()
      event.stopPropagation()
    })

    this._tracks = []
    this._icons = {
      music: 'music_note',
      sound: 'surround_sound',
      voice: 'settings_voice'
    }
    const compareTrack = (a, b) => {
      a = parseFloat(a.pos)
      b = parseFloat(b.pos)
      if (a < b) return -1
      if (a > b) return 1
      return 0
    }
    const tracksHandler = rows => {
      this._tracks = []
      for (let r in rows) {
        rows[r].tracks.map(t => {
          this._tracks.push({
            index: t.index,
            title: t.title,
            type: t.type,
            pos: t.element._windowPosition._left,
            duration: t.element._windowPosition._right - t.element._windowPosition._left
          })
        })
      }
      this._tracks = this._tracks.sort(compareTrack)
      this.buildList()
      // console.log(this._tracks, rows)
    }
    window.SquyncEditor.globals.on('rows-updated', tracksHandler.bind(this))
    window.SquyncEditor.globals.on('track-removed', tracksHandler.bind(this))

    const trackMovedHandler = info => {
      for (let i = 0; i != this._tracks.length; i++) {
        if (this._tracks[i].index === info.index) {
          this._tracks[i].pos = window.SquyncEditor.zoom.pxToTime(info.left)
        }
      }
      this._tracks = this._tracks.sort(compareTrack)
    }
    window.SquyncEditor.globals.on('track-moved', trackMovedHandler.bind(this))
  }

  get status() {
    return this._status
  }

  addItem(item) {
    let root = document.createElement('div')
    root.classList.add('item')
    let { tracksListItem } = render(
      root,
      `
      <div editor-ref="tracksListItem">
          <i class="material-icons">${this._icons[item.type]}</i>
          <div editor-ref="tracksHeaderTitle">${item.title}</div>
          <div editor-ref="tracksHeaderTime">${window.SquyncEditor.zoom.timeToMin(item.pos)}</div>
      </div>
    `
    )

    const itemClickHandler = event => {
      event.preventDefault()
      event.stopPropagation()
      window.SquyncEditor.globals.emit('set-scene-position', item.pos)
      this._menu.classList.remove('show')
      popupBG.hide()
    }
    tracksListItem.addEventListener('click', itemClickHandler.bind(this))

    this._tracksList.appendChild(root)
  }

  buildList() {
    let { tracksList, btnClose } = render(
      this._menu,
      `
    <div editor-ref="tracksListHeader">
        <div editor-ref="Header">
        <div>TRACKS</div>
        <div editor-ref="btnClose"><i class="material-icons">close</i></div>
        </div>
        <div editor-ref="tracksList">
        
        </div>
      </div>
      `
    )
    this._tracksList = tracksList
    this._tracks.map(track => {
      this.addItem(track)
    })
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
    if (this._tracks.length === 0) {
      Alert.show('No tracks!', 'Please insert some tracks.')
    } else {
      if (!window.SquyncEditor.globals.playing) {
        this.buildList()
        this._menu.classList.add('show')
        popupBG.show()
      }
    }
  }
}
