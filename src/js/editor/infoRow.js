import EventEmitter from '../utils/eventEmitter'

class Scene {
  constructor(domNode, src, time) {
    this._node = document.createElement('img')
    this._node.classList.add('scene')
    this._node.src = src
    this._node.style.left = Math.ceil(window.SquyncEditor.zoom.timeToPx(time)) + 'px'
    this._time = time
    domNode.appendChild(this._node)
  }
  newPos() {
    this._node.style.left = Math.ceil(window.SquyncEditor.zoom.timeToPx(this._time)) + 'px'
  }
  get time() {
    return this._time
  }
  set pos(time) {
    this._node.style.left = Math.ceil(window.SquyncEditor.zoom.timeToPx(time)) + 'px'
  }
}

class VideoPlaceholder {
  constructor(domNode) {
    this._placeholder = document.createElement('div')
    this._placeholder.classList.add('row-info-placeholder')
    domNode.appendChild(this._placeholder)
  }
  get width() {
    return parseInt(this._placeholder.style.width || 0)
  }
  set width(width) {
    this._placeholder.style.width = width + 'px'
  }
  get visible() {
    return this._placeholder.classList.contain('show')
  }
  set visible(visible) {
    if (visible) {
      this._placeholder.classList.add('show')
    } else {
      this._placeholder.classList.remove('show')
    }
  }
}

export default class InfoRow extends EventEmitter {
  constructor(domNode) {
    super()
    this._infoRow = document.createElement('div')
    this._infoRow.classList.add('row-info')
    this._background = new VideoPlaceholder(domNode)
    this._scenes = []
    domNode.appendChild(this._infoRow)
    const changeScenesHandler = scenes => {
      while (this._infoRow.firstChild) {
        this._infoRow.removeChild(this._infoRow.firstChild)
      }
      if (scenes) {
        scenes.map(s => {
          let scene = new Scene(this._infoRow, s.img, s.pos)
          this._scenes.push(scene)
        })
      }
    }
    window.SquyncEditor.globals.on('change-scenes', changeScenesHandler.bind(this))

    const newVideoHandler = duration => {
      this._duration = duration
      this._background.width = window.SquyncEditor.zoom.timeToPx(duration)
      this._background.visible = true
    }
    window.SquyncEditor.globals.on('new-video', newVideoHandler.bind(this))

    const zoomHandler = () => {
      newVideoHandler(this._duration)
      this._scenes.map(s => {
        s.newPos()
      })
      // console.log(window.SquyncEditor.zoom.bounds)
    }
    window.SquyncEditor.globals.on('zoom', zoomHandler.bind(this))

    const nextHandler = () => {
      let p = window.SquyncEditor.zoom.timeToPx(window.SquyncEditor.globals.timelineTime)
      for (let i = 0; i != this._infoRow.children.length; i++) {
        let s = this._infoRow.children[i]
        if (parseInt(s.style.left) - 5 > p) {
          window.SquyncEditor.globals.emit('set-scene-position', window.SquyncEditor.zoom.pxToTime(parseInt(s.style.left)))
          break
        }
      }
      // console.log(window.SquyncEditor.zoom.bounds)
    }
    window.SquyncEditor.globals.on('next-scene', nextHandler.bind(this))

    const prevHandler = () => {
      let p = window.SquyncEditor.zoom.timeToPx(window.SquyncEditor.globals.timelineTime)
      for (let i = this._infoRow.children.length; i != 0; i--) {
        let s = this._infoRow.children[i - 1]
        if (parseInt(s.style.left) + 5 < p) {
          window.SquyncEditor.globals.emit('set-scene-position', window.SquyncEditor.zoom.pxToTime(parseInt(s.style.left)))
          break
        }
      }
      // console.log(window.SquyncEditor.zoom.bounds)
    }
    window.SquyncEditor.globals.on('prev-scene', prevHandler.bind(this))
  }
}
