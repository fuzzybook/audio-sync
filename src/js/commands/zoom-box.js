'use strict'
export default class ZoomBox {
  constructor(domNode, css) {
    // console.log('zoom Box ok')
    this._row = document.createElement('div')
    this._row.classList.add(css)
    domNode.appendChild(this._row)
    this._logo = document.createElement('img')
    this._logo.classList.add('logo')
    this._logo.setAttribute('src', '/statics/assets/synchronize.png')
    this._row.appendChild(this._logo)
  }
}