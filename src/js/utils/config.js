'use strict'
export default class Config {
  constructor(root) {
    this._version = 'alpha'
    this._editor = this.getNode(root, 'audio-editor-container')
    this._commands = this.getNode(root, 'editor-commands')

    this._header = this.getNode(root, 'editor-header')
    this._mainPlayer = this.getNode(this._header, 'main-player')
    this._debug = this.getNode(this._header, 'debug')

    this._editorBox = this.getNode(this._editor, 'editor-box')
    this._editorRows = this.getNode(this._editor, 'editor-rows')
    this._editorFrame = this.getNode(this._editor, 'editor-box-frame')

    this._rowsContainer = this.getNode(this._editorBox, 'rows-container')

    this._video = this.getNode(root, 'video-box')

    this._rows = [
      {
        id: 'zoom-box',
        type: 'zoom-box',
        class: 'zoom-box',
        active: true,
        command: true
      },
      {
        id: 'music01',
        type: 'music',
        class: 'track',
        active: true,
        command: false
      },
      {
        id: 'music02',
        type: 'music',
        class: 'track',
        active: true,
        command: false
      },
      {
        id: 'music03',
        type: 'music',
        class: 'track',
        active: false,
        command: false
      },
      {
        id: 'sound',
        type: 'sound',
        class: 'track',
        active: false,
        command: false
      },
      {
        id: 'voice',
        type: 'voice',
        class: 'track',
        active: true,
        command: false
      },
      {
        id: 'version',
        type: 'version',
        class: 'version',
        active: true,
        command: true
      }
    ]

    let cssConfig = window.getComputedStyle(document.querySelector('[config-ref="config"]'), ':before').content
    let cssColors = window.getComputedStyle(document.querySelector('[config-ref="colors"]'), ':before').content
    this._css = JSON.parse(this.removeQuotes(cssConfig))
    this._colors = JSON.parse(this.removeQuotes(cssColors))
    // console.log(this._colors)
  }
  removeQuotes(string) {
    if (typeof string === 'string' || string instanceof String) {
      string = string.replace(/^['"]+|\s+|\\|(;\s?})+|['"]$/g, '')
    }
    return string
  }
  get version() {
    return this._version
  }
  get css() {
    return this._css
  }
  get colors() {
    return this._colors
  }
  get testHeader() {
    return this._testHeader
  }
  get editor() {
    return this._editor
  }
  get commands() {
    return this._commands
  }
  get mainPlayer() {
    return this._mainPlayer
  }
  get debug() {
    return this._debug
  }
  get rowsContainer() {
    return this._rowsContainer
  }
  get video() {
    return this._video
  }
  get rows() {
    return this._rows
  }
  get editorBox() {
    return this._editorBox
  }
  get editorFrame() {
    return this._editorFrame
  }
  get editorRows() {
    return this._editorRows
  }

  getNode(root, ref, empty = false) {
    let node = root.querySelector(`[editor-ref="${ref}"]`)
    if (!node) {
      console.log('node ' + ref + ' - not found')
    } else {
      // console.log('node ' + ref + ' - found ', node)
      if (empty) {
        while (node.firstChild) {
          node.removeChild(node.firstChild)
        }
      }
    }
    return node
  }
}
