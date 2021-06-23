'use strict'
import VuMeter from '../audio/vu-meter'
import VolumeCanvas from './volume-canvas'

export default class RowContainer {
  constructor(domNode, id) {
    let self = this
    this._id = id
    this._audioCtx = null
    this._destination = null
    this._gainNode = null
    this._meter = null
    this._gain = 0.5
    this._muted = false
    this._solo = false

    this._positions = []
    this._tracks = 0
    this._showVolume = false

    this._domNode = document.createElement('div')
    this._domNode.classList.add('track')
    this._domNode.setAttribute('id', 'row-' + id)
    domNode.appendChild(this._domNode)

    this._volumeCanvas = new VolumeCanvas(this._domNode, 'volume-' + id)

    this._domNode.addEventListener('dragover', e => {
      e.preventDefault()
    })

    this._domNode.addEventListener('drop', e => {
      e.preventDefault()
      e.target.style.backgroundColor = 'transparent'
      let data = e.dataTransfer.getData('text')
      try {
        let d = JSON.parse(data)
        let r = window.SquyncEditor.config.editorFrame.getBoundingClientRect()
        if (d.mode === 'file') {
          d.x = e.clientX
          d.pos = e.clientX - d.dragX - r.x + window.SquyncEditor.globals.scrollPos // event.clientX - d.dragX - window.SquyncEditor.globals.scrollPos
          d.row = self._id
          window.SquyncEditor.globals.emit('drop-file', d)
        }
        if (d.mode === 'track') {
          d.x = e.clientX
          d.pos = e.target.offsetLeft
          d.row = self._id
          window.SquyncEditor.globals.emit('drop-track', d)
        }
      } catch (error) {
        console.log(error)
      }
    })

    this._domNode.addEventListener(
      'dragenter',
      () => {
        // event.target.style.backgroundColor = 'rgba(2,127,228,0.3)'
      },
      false
    )

    this._domNode.addEventListener(
      'dragleave',
      () => {
        this._domNode.style.backgroundColor = 'transparent'
      },
      false
    )

    const dragEndHandler = () => {
      // console.log('dragend')
      this._domNode.style.backgroundColor = 'transparent'
      window.SquyncEditor.globals.emit('drag-target', 0, false)
    }
    window.SquyncEditor.globals.on('drag-end', dragEndHandler.bind(this))

    const volumeHandler = show => {
      this._showVolume = show
      if (show && this._tracks > 0) {
        this._volumeCanvas.volumeCanvas(show)
      } else {
        this._volumeCanvas.volumeCanvas(false)
      }
    }
    window.SquyncEditor.globals.on('volume-canvas', volumeHandler.bind(this))

    const soloHandler = (id, state) => {
      if (id === this._id) {
        this._solo = state
        if (state && this._muted) {
          this._muted = false
          window.SquyncEditor.globals.emit('muted-selected', this._id, this._muted)
        }
      } else {
        this._solo = false
        window.SquyncEditor.globals.emit('solo-selected', this._id, this._solo)
      }
    }
    window.SquyncEditor.globals.on('solo-btn', soloHandler.bind(this))

    const muteHandler = (id, state) => {
      if (id === this._id) {
        this._muted = state
        if (state) {
          this._solo = false
          window.SquyncEditor.globals.emit('solo-selected', this._id, this._solo)
        }
      }
    }
    window.SquyncEditor.globals.on('mute-btn', muteHandler.bind(this))
  }

  clear() {
    while (this._domNode.firstChild) {
      this._domNode.removeChild(this._domNode.firstChild)
    }
    this._tracks = 0
    this._volumeCanvas = new VolumeCanvas(this._domNode, 'volume-' + this._id)
  }
  comparator(a, b) {
    if (a[0] < b[0]) return -1
    if (a[0] > b[0]) return 1
    return 0
  }

  get muted() {
    return this._muted
  }

  get solo() {
    return this._solo
  }

  get positions() {
    return this._positions
  }

  set positions(positions) {
    this._positions = positions.sort(this.comparator)
  }

  get tracks() {
    return this._tracks
  }

  set tracks(tracks) {
    this._tracks = tracks
  }

  get volumePoints() {
    return this._volumeCanvas.points
  }

  set volumePoints(points) {
    this._volumeCanvas.points = points
  }
  /// audio node

  inersectVolumePos(pos) {
    return this._volumeCanvas.getIntersectedline(pos)
  }

  connectAudioNode(source) {
    source.connect(this._gainNode)
  }

  setAudioNodes(audioCtx, destination) {
    this._audioCtx = audioCtx
    this.vuMeter = new VuMeter(document.getElementById('vu-meter-' + this._id))
    this.meter = this.vuMeter.setProcessor(this._audioCtx)
    this._gainNode = this._audioCtx.createGain()
    this._gainNode.gain.setValueAtTime(this._gain, audioCtx.currentTime)
    this._gainNode.connect(destination)
    this._gainNode.connect(this.meter)
  }

  get destination() {
    return this._gainNode
  }
}
