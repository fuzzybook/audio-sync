'use strict'
export default class VersionBox {
  constructor(domNode, css) {
    // console.log(window.SquyncEditor.config.version)
    this._row = document.createElement('div')
    this._row.classList.add(css)
    domNode.appendChild(this._row)
    this._row.innerHTML = `<span>${window.SquyncEditor.config.version}</span>`
  }
}
