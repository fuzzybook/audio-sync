'use strict'
import EventEmitter from '../utils/eventEmitter'
import { render } from '../utils/dom'

export default class ScenesHeader extends EventEmitter {
  constructor(domNode) {
    super()
    this._videoProportions = 1.5
    this._refs = render(
      domNode,
      `
    <div editor-ref="scenesHeader">
      <div editor-ref="header">
        <div>ADD NEW SCENE</div>
        <div editor-ref="btnClose"><i class="material-icons">close</i></div>
      </div>
      <div editor-ref="scenesHeaderVideo">
        <div class="input-name">
          <div editor-ref="scenesHeaderImgBox">
            <img editor-ref="scenesHeaderImg" />
          </div>
          <div editor-ref="scenesHeaderText">
            <div class="label">Title</div>
            <input type="text" editor-ref="scenesHeaderTitle" />
          </div>
        </div>
        <div class="text-area">
        <div class="label">Description</div>
          <textarea editor-ref="scenesHeaderDescription"  ></textarea>
        </div>
        <div editor-ref="scenesHeaderBtn">
          <div editor-ref="scenesHeaderBtnAdd" class="btn-material">
            <div>ADD</div>
          </div>
        </div>
      </div>
    </div>
    `
    )

    this._refs.scenesHeaderBtnAdd.addEventListener('click', () => {
      event.preventDefault()
      event.stopPropagation()
      if (this._refs.scenesHeaderTitle.value.length === 0) {
        this._refs.scenesHeaderTitle.focus()
        return
      }
      window.SquyncEditor.globals.emit('add-scene', {
        title: this._refs.scenesHeaderTitle.value,
        description: this._refs.scenesHeaderDescription.value,
        img: this._refs.scenesHeaderImg.getAttribute('src')
      })
      this.emit('close')
    })

    const closeHandler = event => {
      event.preventDefault()
      event.stopPropagation()
      this.emit('close')
    }
    this._refs.btnClose.addEventListener('click', closeHandler.bind(this))
    this._refs.scenesHeaderTitle.focus()
  }

  get image() {
    return this._refs.scenesHeaderImg.getAttribute('src')
  }
  set image(image) {
    return (this._refs.scenesHeaderImg.src = image)
  }

  get refs() {
    return this._refs
  }

  set focus(focus) {
    if (focus) {
      setTimeout(() => {
        this._refs.scenesHeaderTitle.focus()
      }, 100)
    } else {
      this._refs.scenesHeaderTitle.blur()
    }
  }

  clearInput() {
    this._refs.scenesHeaderTitle.value = ''
    this._refs.scenesHeaderDescription.value = ''
  }
}
