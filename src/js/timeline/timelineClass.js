'use strict'
import Slider from '../slider/sliderClass.js'
import EventEmitter from '../utils/eventEmitter.js'

export default class Timeline extends EventEmitter {
  constructor() {
    super()
    let self = this
    self._domNode = window.SquyncEditor.config.editor
    self._tracksRows = self.getNode('editor-box')

    self.CANVAS_HEIGHT = 24
    // positions
    self._position = 0
    self._sliderPosition = 0
    self._lastPosition = 0
    // initialize container
    self.drawGrid(window.SquyncEditor.zoom.scale, window.SquyncEditor.zoom.duration, self.CANVAS_HEIGHT)

    self._tracksRows.addEventListener('scroll', () => {
      self._position = window.SquyncEditor.zoom.scale * (self._sliderPosition + self._tracksRows.scrollLeft)
      self._slider.setLabel(self.toMin(self._position))
      window.SquyncEditor.globals.setPosition({
        pos: self._position / window.SquyncEditor.zoom.scale,
        scroll: self._tracksRows.scrollLeft
      })
      window.SquyncEditor.globals.emit('position', self._position, self._tracksRows.scrollLeft, self._tracksRows.scrollWidth)
      self.emit('changed-position', self._position)
    })

    //
    // slider mamagement
    //
    self._slider = new Slider(self.getNode('slider'), self._overflow)
    // changed slider value PERCENT?
    self._slider.on('changed', value => {
      if (!this._slider) return
      this._sliderPosition = value
      this._position = window.SquyncEditor.zoom.scale * (this._sliderPosition + this._tracksRows.scrollLeft)
      this._slider.setLabel(this.toMin(this._position))
      // only for comand bar
      window.SquyncEditor.globals.emit('position', this._position, this._tracksRows.scrollLeft, this._tracksRows.scrollWidth)
      window.SquyncEditor.globals.setPosition({
        pos: this._position / window.SquyncEditor.zoom.scale,
        scroll: this._tracksRows.scrollLeft
      })
      this.emit('changed-position', this._position)
    })
    // slider overflow range for auto scroll
    self._slider.on('overflow', o => {
      // let gap = 100 - parseInt(100 * window.SquyncEditor.zoom.scale) || 1
      if (o === -1) {
        if (this._tracksRows.scrollLeft > 0) this._tracksRows.scrollLeft -= 1
      } else if (o === 1) {
        let max = this._tracksRows.scrollWidth - this._tracksRows.clientWidth
        if (this._tracksRows.scrollLeft < max) this._tracksRows.scrollLeft += 1
      }
      window.SquyncEditor.globals.setPosition({
        pos: this._position,
        scroll: this._tracksRows.scrollLeft
      })
    })
    self._slider.on('key-tab', () => {
      self.emit('key-tab')
    })
    /////////////////////////////

    window.SquyncEditor.globals.on('zoom-reset', () => {
      // console.log('reset')
      window.SquyncEditor.globals.emit('zoom', self.setZoom())
      window.SquyncEditor.globals.emit('position', this._position, this._tracksRows.scrollLeft, this._tracksRows.scrollWidth)
      window.SquyncEditor.globals.emit('zoom-after-reset')
    })

    window.SquyncEditor.globals.on('zoom-inc', () => {
      // console.log('inc')
      window.SquyncEditor.globals.emit('zoom', self.incrementZoom())
      window.SquyncEditor.globals.emit('position', this._position, this._tracksRows.scrollLeft, this._tracksRows.scrollWidth)
    })

    window.SquyncEditor.globals.on('zoom-dec', () => {
      // console.log('dec')
      window.SquyncEditor.globals.emit('zoom', self.decrementZoom())
      window.SquyncEditor.globals.emit('position', this._position, this._tracksRows.scrollLeft, this._tracksRows.scrollWidth)
    })

    window.SquyncEditor.globals.on('reset-timeline', () => {
      self.resetPosition()
    })
  }
  get pos() {
    return this._position
  }

  get posInPx() {
    return this._position / window.SquyncEditor.zoom.scale
  }

  get scrollLeft() {
    return this._tracksRows.scrollLeft
  }

  resetPosition() {
    this._tracksRows.scrollLeft = 0
    this._slider.moveSliderTo(0, false)
    window.SquyncEditor.globals.setPosition({
      pos: 0,
      scroll: 0
    })
  }

  isEndInFrame() {
    if (window.SquyncEditor.videoStore.videoPresent) {
      let maxPos = window.SquyncEditor.zoom.pxToTime(this._tracksRows.clientWidth + this._tracksRows.scrollLeft)
      return window.SquyncEditor.videoStore.duration <= maxPos
    }
    return false
  }

  isInFrame(time) {
    let px = window.SquyncEditor.zoom.timeToPx(time)
    return px >= this._tracksRows.scrollLeft && px <= this._tracksRows.scrollLeft + this._tracksRows.clientWidth
  }

  // move sliter to new position, mode test or full play
  moveSliderTo(_time, immediate = false) {
    // if (mode) console.log(mode)
    // p is real position according scroll
    let time = window.SquyncEditor.zoom.timeToPx(_time)
    let p = 0
    if (this.isInFrame(time) && immediate) {
      p = time
      this._slider.moveSliderTo(p)
    } else {
      p = time - this._tracksRows.scrollLeft
      // sroll left
      if (p < 0) {
        this._tracksRows.scrollLeft += p - 2
        p = 0
      }

      if (p > this._tracksRows.clientWidth / 2 && !this.isEndInFrame()) {
        if (this._tracksRows.scrollWidth - this._tracksRows.clientWidth === this._tracksRows.scrollLeft) {
          this._slider.moveSliderTo(p)
        } else {
          this._slider.moveSliderTo(this._tracksRows.clientWidth / 2)
          this._tracksRows.scrollLeft = time - this._tracksRows.clientWidth / 2
        }
      } else {
        this._slider.moveSliderTo(p)
      }
    }
    window.SquyncEditor.globals.setPosition({
      pos: p,
      scroll: this._tracksRows.scrollLeft
    })
  }
  // utility to get selector
  getNode(ref) {
    let node = this._domNode.querySelector(`[editor-ref="${ref}"]`)
    if (!node) {
      throw 'node ' + ref + ' not found'
    }
    return node
  }
  // convert seconds to readable format
  toMin(time) {
    var mins = ~~(time / 60)
    var secs = (time % 60).toFixed(2)
    return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs
  }
  resize(max) {
    // console.log('resize', max)
    max += this._tracksRows.clientWidth / 2
    if (max * window.SquyncEditor.zoom.scale > window.SquyncEditor.zoom.duration) {
      window.SquyncEditor.zoom.duration = max * window.SquyncEditor.zoom.scale
      this.drawGrid(window.SquyncEditor.zoom.scale, window.SquyncEditor.zoom.duration, this.CANVAS_HEIGHT)
    }
  }
  // zoom in
  setZoom() {
    let z = window.SquyncEditor.zoom.zoom
    this.drawGrid(window.SquyncEditor.zoom.scale, window.SquyncEditor.zoom.duration, this.CANVAS_HEIGHT)
    return z
  }
  // zoom in
  incrementZoom() {
    let z = window.SquyncEditor.zoom.incrementZoom()
    this.drawGrid(window.SquyncEditor.zoom.scale, window.SquyncEditor.zoom.duration, this.CANVAS_HEIGHT)
    return z
  }
  // zoom out
  decrementZoom() {
    let z = window.SquyncEditor.zoom.decrementZoom()
    this.drawGrid(window.SquyncEditor.zoom.scale, window.SquyncEditor.zoom.duration, this.CANVAS_HEIGHT)
    return z
  }

  // draw canvas chunk time and lines
  drawCanvasTime(ctx, scale, time, length) {
    let h = ctx.canvas.clientHeight
    for (let i = 0; i <= length; i += 10) {
      ctx.moveTo(i + 0.5, h + 0.5)
      if ((time + i) % 100 === 0) {
        ctx.lineTo(i + 0.5, h - 10.5)
        let text = ''
        if (time + i !== 0) {
          let mins = ~~(((time + i) * scale) / 60)
          let secs = ((time + i) * scale) % 60
          text = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs
          let tw = ctx.measureText(text).width
          ctx.fillText(text, i - tw / 2 + 0.5, 12)
        }
      } else {
        ctx.lineTo(i + 0.5, h - 5.5)
      }
      ctx.stroke()
    }
  }
  // clear all canvas
  removeCanvas(div) {
    while (div.firstChild) {
      div.removeChild(div.firstChild)
    }
  }
  // create canvas array
  createCanvas(div, scale, height, maxWidth) {
    this.removeCanvas(div)
    const width = 1000
    let items = []
    let w = 0
    div.style.width = maxWidth + 'px'
    while (w < maxWidth) {
      let canvas = document.createElement('canvas')
      div.appendChild(canvas)
      let ctx = canvas.getContext('2d')
      let nextWidth = width
      if (width * (items.length + 1) > maxWidth) {
        nextWidth = maxWidth - width * items.length
      }
      ctx.scale(1, 1)
      ctx.canvas.width = nextWidth
      ctx.canvas.height = height
      ctx.font = 'normal 12px courier New'
      // ctx.fillStyle = '#FFFFFF'
      this.drawCanvasTime(ctx, scale, w, nextWidth)
      items.push(canvas)
      w += nextWidth
    }
    div.parentNode.style.width = w + 'px'
    return items
  }

  // draw canvas array
  drawGrid(scale, duration, height) {
    var timeline = this.getNode('canvas')
    var width = duration / scale
    if (width < this._tracksRows.clientWidth) {
      width = this._tracksRows.clientWidth
    }
    this.createCanvas(timeline, scale, height, width)
  }
}
