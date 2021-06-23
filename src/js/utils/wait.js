'use strict'
import { render } from './dom'
import popupBG from './popup-background'
class Wait {
  constructor() {
    this._wait = document.createElement('div')
    this._wait.id = 'wait-box'
    this._wait.classList.add('wait-box')
    this._loader = null
    popupBG.insert(this._wait)

    this._refs = render(
      this._wait,
      `
      <div editor-ref="waitBoxPopup">
        <img src="${this._loader}" />
      </div>
    `
    )
  }
  hide() {
    this._wait.classList.remove('show')
    popupBG.hide()
    popupBG.dark(false)
  }
  show(svg) {
    if (svg) {
      this._loader = svg
    } else {
      this._loader = 'statics/assets/video-loader.svg'
    }
    this._wait.classList.add('show')
    this._refs = render(
      this._wait,
      `
      <div editor-ref="waitBoxPopup">
        <img src="${this._loader}" />
      </div>
    `
    )
    popupBG.show()
    popupBG.dark(true)
  }
}

const ___waitBox = new Wait()

export default ___waitBox
