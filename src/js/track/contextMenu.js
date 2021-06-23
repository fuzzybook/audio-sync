'use strict'
import EventEmitter from '../utils/eventEmitter.js'
export default class TrackContextMenu extends EventEmitter {
  constructor(domNode) {
    super()
    let self = this
    self._status = {
      locked: false
    }
    self._menuBG = document.getElementById('track-context-menu-bg')
    let body = document.getElementsByTagName('BODY')[0]
    self._menuBG = document.createElement('div')
    self._menuBG.id = 'track-context-menu-bg'
    self._menuBG.classList.add('track-context-menu-bg')
    self._menu = document.createElement('div')
    self._menu.id = 'track-context-menu'
    self._menu.classList.add('track-context-menu')
    self._menuBG.append(self._menu)
    body.prepend(self._menuBG)

    window.SquyncEditor.globals.on('play-single-track', () => {
      self._menuBG.classList.remove('show')
    })

    self._items = [{
      id: 'lock',
      icon: ['lock', 'lock_open'],
      text: ['lock track', 'unlock track'],
      short: ''
    }, {
      id: 'reset',
      icon: ['settings_backup_restore'],
      text: ['restore track'],
      short: ''
    }, {
      id: 'delete',
      icon: ['delete_forever'],
      text: ['remove track'],
      short: '⇧ ⌥  R'
    }, {
      id: 'edit',
      icon: ['edit'],
      text: ['edit track'],
      short: ''
    }]

    domNode.addEventListener('contextmenu', e => {
      e.preventDefault()
      if (!window.SquyncEditor.globals.playing) {
        self._menuBG.classList.add('show')
        self.emit('menu-open')
        self._menu.style.left = e.clientX - 10 + 'px'
        self._menu.style.top = e.clientY - self._menu.clientHeight + 10 + 'px'
      }
    })
    self._menuBG.addEventListener('click', () => {
      self._menuBG.classList.remove('show')
    })
    self._menu.innerHTML = ''
    for (let i in self._items) {
      let item = document.createElement('div')
      item.classList.add('item')
      item.innerHTML = `<div><i class="material-icons">${self._items[i].icon[0]}</i><span>${self._items[i].text[0]}</span></div><div><span class='short'>${self._items[i].short}</span></div>`
      item.addEventListener('click', e => {
        if (self._items[i].id === 'lock') {
          self._status.locked = !self._status.locked
          if (self._status.locked) {
            e.target.innerHTML = `<div><i class="material-icons">${self._items[i].icon[1]}</i><span>${self._items[i].text[1]}</span></div><div><span class='short'>${self._items[i].short}</span></div>`

          } else {
            e.target.innerHTML = `<div><i class="material-icons">${self._items[i].icon[0]}</i><span>${self._items[i].text[0]}</span></div><div><span class='short'>${self._items[i].short}</span></div>`
          }
        }
        self.emit('menu-selection', self._items[i].id, self._status)
        self._menuBG.classList.remove('show')
      })
      self._menu.append(item)
    }
  }

  get status() {
    return this._status
  }
}