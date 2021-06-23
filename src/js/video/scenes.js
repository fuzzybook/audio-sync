'use strict'
import EventEmitter from '../utils/eventEmitter'
import { render } from '../utils/dom'
export default class Scenes extends EventEmitter {
  constructor(domNode) {
    super()
    this._domNode = domNode
    let { scenesList } = render(
      this._domNode,
      `
      <div editor-ref="scenesList">
      </div>
    `
    )
    this._scenesList = scenesList
    this.biuldList()
  }
  setScenes(scenes) {
    window.SquyncEditor.videoStore.scenes = scenes
  }

  updatePosition(pos) {
    window.SquyncEditor.globals.emit('set-scene-position', pos)
  }

  addItem(item) {
    window.SquyncEditor.videoStore.addScene(item)
  }

  buildItem(item) {
    let self = this
    let node = document.createElement('div')
    let { scenesListItem } = render(
      node,
      `
      <div editor-ref="scenesListItem">
      <div editor-ref="scenesHeaderImgBox">
          <img editor-ref="scenesHeaderImg" src="${item.img}"/>
        </div>
        <div editor-ref="scenesHeaderText">
          <div editor-ref="scenesHeaderTitle">${item.title} ${item.pos}</div>
          <div editor-ref="scenesHeaderDescription" >${item.description}</div>
        </div>
        <div editor-ref="scenesHeaderBtn">
          <div editor-ref="scenesHeaderBtnAdd" class="btn-material">
            <div>remove</div>
          </div>
        </div>
      
      </div>
    `
    )
    scenesListItem.addEventListener('click', () => {
      self.updatePosition(item.pos)
    })
    this._scenesList.appendChild(node)
  }

  biuldList() {
    while (this._domNode.firstChild) {
      this._domNode.removeChild(this._domNode.firstChild)
    }
    let { scenesList } = render(
      this._domNode,
      `
      <div editor-ref="scenesList">
      </div>
    `
    )
    this._scenesList = scenesList
    if (window.SquyncEditor.videoStore.scenes) {
      window.SquyncEditor.videoStore.scenes.map(scene => {
        this.buildItem(scene)
      })
    }
  }
}
