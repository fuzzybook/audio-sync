'use strict'
import EventEmitter from './eventEmitter.js'
export default class ContextMenu extends EventEmitter {
  constructor(domNode, items) {
    super()
    let self = this
    self._menuBG = document.getElementById('context-menu-bg')
    if (!self._menuBG) {
      let body = document.getElementsByTagName('BODY')[0]
      self._menuBG = document.createElement('div')
      self._menuBG.id = 'context-menu-bg'
      self._menuBG.classList.add('context-menu-bg')
      self._menu = document.createElement('div')
      self._menu.id = 'context-menu'
      self._menu.classList.add('context-menu')
      self._menuBG.append(self._menu)
      body.prepend(self._menuBG)
    } else {
      self._menu = document.getElementById('context-menu')
    }

    window.SquyncEditor.globals.on('play-single-track', () => {
      self._menuBG.classList.remove('show')
    })

    domNode.addEventListener('contextmenu', e => {
      e.preventDefault()
      if (!window.SquyncEditor.globals.playing) {
        // --console.log('context menu', e, e.target.id)
        self.emit('menu-open')
        self._menu.style.left = e.clientX - 10 + 'px'
        self._menu.style.top = e.clientY - 10 + 'px'
        self._menuBG.classList.add('show')
      }
    })
    self._menuBG.addEventListener('click', () => {
      self._menuBG.classList.remove('show')
    })
    self._menu.innerHTML = ''
    for (let i in items) {
      let item = document.createElement('div')
      item.classList.add('item')
      item.innerHTML = `<i class="material-icons">face</i><span>${items[i].text}</span>`
      item.addEventListener('click', () => {
        self.emit('menu-selection', items[i])
        self._menuBG.classList.remove('show')
      })
      self._menu.append(item)
    }
  }
}