'use strict'
import { render } from '../utils/dom'
import popupBG from '../utils/popup-background'
class PromptVoiceName {
  constructor() {
    this._cb = null
    this._menu = document.createElement('div')
    this._menu.id = 'prompt-box'
    this._menu.classList.add('prompt-box')
    popupBG.insert(this._menu)

    this._menu.addEventListener('click', event => {
      event.preventDefault()
      event.stopPropagation()
    })

    this._refs = render(
      this._menu,
      `
      <div editor-ref="promptBoxPopup">
        <div editor-ref="promptText">
          <div editor-ref="promptTextTitle"></div>
          <div editor-ref="promptTextSubtitle"></div>
          <div class="input-text">
            <input type="text" editor-ref="inputText" />
          </div>
        </div>
        <div editor-ref="promptBtn">
          <div editor-ref="promptBtnOK" class="btn-material">
            <div>OK</div>
          </div>
          <div editor-ref="promptBtnCancel" class="btn-material">
            <div>CANCEL</div>
          </div>
        </div>
      </div>
    `
    )

    const okHandler = () => {
      this._menu.classList.remove('show')
      popupBG.hide()
      if (typeof this._cb === 'function') {
        this._cb(this._refs.inputText.value)
      }
    }
    this._refs.promptBtnOK.addEventListener('click', okHandler.bind(this))

    const cancelHandler = () => {
      this._menu.classList.remove('show')
      popupBG.hide()
      if (typeof this._cb === 'function') {
        this._cb(false)
      }
    }
    this._refs.promptBtnCancel.addEventListener('click', cancelHandler.bind(this))
  }

  show(title, subtitle, cb) {
    this._cb = cb
    this._refs.promptTextTitle.innerText = title
    this._refs.promptTextSubtitle.innerText = subtitle
    this._refs.inputText.value = ''
    this._menu.classList.add('show')
    popupBG.show()
    setTimeout(() => {
      this._refs.inputText.focus()
    }, 100)
  }
}

const ___PromptVoiceName = new PromptVoiceName()

export default ___PromptVoiceName
