'use strict'
import { render } from './dom'
import popupBG from './popup-background'
class Alert {
  constructor() {
    this._menu = document.createElement('div')
    this._menu.id = 'alert-box'
    this._menu.classList.add('alert-box')
    popupBG.insert(this._menu)

    this._refs = render(
      this._menu,
      `
      <div editor-ref="alertBoxPopup">
        <div editor-ref="alertText">
          <div editor-ref="alertTextTitle"></div>
          <div editor-ref="alertTextSubtitle"></div>
        </div>
        <div editor-ref="alertBtn">
          <div editor-ref="alertBtnOK" class="btn-material">
            <div>OK</div>
          </div>
        </div>
      </div>
    `
    )

    const hideHandler = () => {
      this._menu.classList.remove('show')
      popupBG.hide()
    }
    this._refs.alertBtnOK.addEventListener('click', hideHandler.bind(this))
  }

  show(title, subtitle) {
    this._refs.alertTextTitle.innerText = title
    this._refs.alertTextSubtitle.innerText = subtitle
    this._menu.classList.add('show')
    popupBG.show()
  }
}

const ___alertBox = new Alert()

export default ___alertBox
