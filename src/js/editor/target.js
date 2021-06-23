'use strict'
import EventEmitter from '../utils/eventEmitter'
import { render } from '../utils/dom'
export default class Target extends EventEmitter {
  constructor(color = '#ff0000') {
    super()
    const { Target } = render(window.SquyncEditor.config.rowsContainer, `<div editor-ref="Target" style="background-color:${color};"></div>`)
    this._domNode = Target
    this._domNode.visible = false
  }
  get visible() {
    return this._domNode.visible
  }
  set visible(visible) {
    this._domNode.visible = visible
  }
  moveTo(pos, visible) {
    window.SquyncEditor.globals.targetPos = pos
    this._domNode.visible = visible
    this._domNode.style.left = pos + 'px'
  }
}