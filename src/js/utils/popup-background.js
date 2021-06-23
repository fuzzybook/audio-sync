'use strict'
import {
  removeAllChildren,
  isHTMLElement
} from './dom'
class PopupBG {
  constructor() {
    this._popupBG = document.getElementById('popup-frame-bg')
    if (!this._popupBG) {
      let body = document.getElementsByTagName('BODY')[0]
      this._popupBG = document.createElement('div')
      this._popupBG.id = 'popup-frame-bg'
      this._popupBG.classList.add('popup-frame-bg')
      body.prepend(this._popupBG)

      const hideHandler = () => {
        this._popupBG.classList.remove('show')
        this._popupBG.childNodes.forEach(node => {
          node.classList.remove('show')
        })
      }
      this._popupBG.addEventListener('click', hideHandler.bind(this))
    }
  }
  dark(mode) {
    if (mode) {
      this._popupBG.classList.add('dark')
    } else {
      this._popupBG.classList.remove('dark')
    }
  }
  show() {
    this._popupBG.classList.add('show')
  }
  hide() {
    this._popupBG.classList.remove('show')
  }
  insert(domNode) {
    if (isHTMLElement(domNode)) {
      this._popupBG.appendChild(domNode)
    }
  }
  add(domNode) {
    if (isHTMLElement(domNode)) {
      this._popupBG.appendChild(domNode)
      this.show()
    }
  }
  remove(domNode) {
    if (isHTMLElement(domNode)) {
      removeAllChildren(domNode)
      this._popupBG.removeChild(domNode)
      while (this._popupBG.firstChild) {
        this._popupBG.removeChild(this._popupBG.firstChild)
      }
      this.hide()
    }
  }
}

const ___popupBG = new PopupBG()

export default ___popupBG