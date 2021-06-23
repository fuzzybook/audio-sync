'use strict'
import EventEmitter from '../utils/eventEmitter.js'
import { render } from '../utils/dom'
import Hammer from '../hammer/hammer'
export default class Fader extends EventEmitter {
  constructor(domNode) {
    super()
    this._fader = null
    this._faderTrack = null
    this._faderThumb = null
    this.gain = 1
    this.speed = 1
    this.targetFaderTop = 0
    this.faderTop = 0
    this.start = this.attenuation = 0
    this._disabled = true

    this.buildFader(domNode)

    this.hammer = new Hammer.Manager(this._faderThumb)
    this.hammer.add(
      new Hammer.Pan({
        direction: Hammer.DIRECTION_VERTICAL,
        threshold: 0
      })
    )
    this.hammer.add(new Hammer.Tap())

    const panHandler = event => {
      let trackRect = this._faderTrack.getBoundingClientRect()
      let absoluteTrackTop = trackRect.top + document.body.scrollTop
      this.targetFaderTop = Math.min(Math.max(event.center.y - absoluteTrackTop, 0), this._faderTrack.offsetHeight)
      this.faderTop = (this.targetFaderTop - this.faderTop) * this.speed + this.faderTop

      this.gain = this.faderTop / this._faderTrack.offsetHeight
      this._faderThumb.style.top = this.faderTop + 'px'
      if (!this._disabled) {
        this.emit('change', this.gain)
      }
    }
    this.hammer.on('pan', panHandler.bind(this))
  }

  set disabled(value) {
    if (value) {
      this._disabled = true
      this._fader.classList.add('disabled')
    } else {
      this._disabled = false
      this._fader.classList.remove('disabled')
    }
    this.emit('disabled', value)
  }
  set value(value) {
    this.disabled = false
    this.faderTop = this._faderTrack.offsetHeight * value
    this._faderThumb.style.top = this.faderTop + 'px'
  }

  buildFader(domNode) {
    let { fader, faderTrack, faderThumb } = render(
      domNode,
      `
      <div editor-ref="fader" class="disabled">
        <div  editor-ref="faderTrack" >
          <div editor-ref="faderThumb"></div>
        </div>
        <div class="scale">
          <div class="scale-tick" style="bottom: 0%;"></div>
          <div class="scale-tick" style="bottom: 10%;"></div>
          <div class="scale-tick" style="bottom: 20%;"></div>
          <div class="scale-tick" style="bottom: 30%;"></div>
          <div class="scale-tick" style="bottom: 40%;"></div>
          <div class="scale-tick" style="bottom: 50%;"></div>
          <div class="scale-tick" style="bottom: 60%;"></div>
          <div class="scale-tick" style="bottom: 70%;"></div>
          <div class="scale-tick" style="bottom: 80%;"></div>
          <div class="scale-tick" style="bottom: 90%;"></div>
          <div class="scale-tick" style="bottom: 100%;"></div>
        </div>
      </div>
    `
    )
    this._fader = fader
    this._faderTrack = faderTrack
    this._faderThumb = faderThumb
  }
}
