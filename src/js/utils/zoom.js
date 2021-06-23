'use strict'
export default class Zoom {
  constructor() {
    this._duration = 300 // 3 minuts
    this._scale = 0.01
    this._zoom = 0
    this._maxZoom = 12
    this._zoomMap = [{
      scale: 0.01,
      unit: 'seconds',
      line: 10,
      subline: 5
    },
    {
      scale: 0.02,
      unit: 'seconds',
      line: 10,
      subline: 5
    },
    {
      scale: 0.05,
      unit: 'seconds',
      line: 10,
      subline: 5
    },
    {
      scale: 0.1,
      unit: 'seconds',
      line: 100,
      subline: 5
    },
    {
      scale: 0.2,
      unit: 'seconds',
      line: 100,
      subline: 5
    },
    {
      scale: 0.5,
      unit: 'seconds',
      line: 100,
      subline: 5
    },
    {
      scale: 1.0,
      unit: 'seconds',
      line: 100,
      subline: 5
    },
    {
      scale: 2.0,
      unit: 'seconds',
      line: 100,
      subline: 5
    },
    {
      scale: 5.0,
      unit: 'seconds',
      line: 100,
      subline: 5
    },
    {
      scale: 10.0,
      unit: 'seconds',
      line: 100,
      subline: 5
    }
    ]
  }
  get pxDuration() {
    return this.timeToPx(this._duration)
  }
  get duration() {
    return this._duration
  }
  set duration(duration) {
    // console.log('duration', this._zoom, this._scale)
    let max = window.SquyncEditor.config.editorFrame.clientWidth
    let len = this.timeToPx(duration)
    let ideal = this.pxToTime(len / max)
    for (let i = 0; i != this._zoomMap.length; i++) {
      if (this._zoomMap[i].scale >= ideal) {
        this._zoom = i - 1
        this._scale = this._zoomMap[i - 1].scale
        this._maxZoom = i
        break
      }
    }
    this._duration = duration
    // console.log('duration', this._zoom, this._scale)
    window.SquyncEditor.globals.emit('zoom-reset')
  }

  get bounds() {
    return {
      scrollWidth: window.SquyncEditor.config.editorBox.scrollWidth,
      width: window.SquyncEditor.config.editorBox.clientWidth
    }
  }

  get scale() {
    return this._scale
  }
  get zoom() {
    return {
      scale: this._scale,
      zoom: this._zoom
    }
  }

  resetZoom(zoom = 0) {
    if(zoom < 0 ) zoom = 0
    this._zoom = zoom
    this._scale = this._zoomMap[this._zoom].scale
    window.SquyncEditor.globals.emit('zoom-reset')
  }

  incrementZoom() {
    if (this._zoom < this._zoomMap.length - 1 && this._zoom < this._maxZoom) {
      this._zoom++
      this._scale = this._zoomMap[this._zoom].scale
    }
    return {
      scale: this._scale,
      zoom: this._zoom
    }
  }

  decrementZoom() {
    if (this._zoom > 0) {
      this._zoom--
      this._scale = this._zoomMap[this._zoom].scale
    }
    return {
      scale: this._scale,
      zoom: this._zoom
    }
  }

  timeToPx(time) {
    return time / this._scale
  }

  pxToTime(px) {
    return px * this._scale
  }

  timeToMin(time) {
    if (!time && time !== 0) {
      return '--:--.--'
    }
    var mins = ~~(time / 60)
    var secs = (time % 60).toFixed(2)
    return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs
  }

  pxToMin(pixels) {
    return this.timeToMin(this.pxToTime(pixels))
  }
}