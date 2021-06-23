/*
The MIT License (MIT)
Copyright (c) 2014 Chris Wilson
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/*
Usage:
audioNode = createAudioMeter(audioContext,clipLevel,averaging,clipLag)
audioContext: the AudioContext you're using.
clipLevel: the level (0 to 1) that you would consider "clipping".
   Defaults to 0.98.
averaging: how "smoothed" you would like the meter to be over time.
   Should be between 0 and less than 1.  Defaults to 0.95.
clipLag: how long you would like the "clipping" indicator to show
   after clipping has occured, in milliseconds.  Defaults to 750ms.
Access the clipping through node.checkClipping(); use node.shutdown to get rid of it.
*/

export default class AudioMeter {
  constructor(domNode) {
    this._processor = null
    this._volume = 0
    this._loopActive = true
    this.WIDTH = 10
    this.HEIGHT = 42
    this.rafID = null
    // --console.log(domNode)
    this.domNode = domNode
    this.domNode.setAttribute('height', this.HEIGHT + 'px')
    this.domNode.setAttribute('width', this.WIDTH + 'px')
    this.canvasContext = this.domNode.getContext('2d')
    this._clipSize = 20
    this._showPeaks = false
    this._hInRange = this.HEIGHT - this._clipSize
    this._peak = 0

    var gradient = this.canvasContext.createLinearGradient(6, 6, 6, this.HEIGHT)
    gradient.addColorStop(0, 'red')
    gradient.addColorStop(this._clipSize / this.HEIGHT, '#600202') //red
    gradient.addColorStop(this._clipSize / this.HEIGHT, '#d8af27') //amber
    gradient.addColorStop(1, '#004f00') //green
    this.canvasContext.clearRect(0, 0, this.WIDTH, this.HEIGHT)
    this.canvasContext.fillStyle = gradient

    const loop = () => {
      if (!this.canvasContext) {
        return
      }

      // clear the background
      this.canvasContext.clearRect(0, 0, this.WIDTH, this.HEIGHT)

      // check if we're currently clipping
      if (this._processor.checkClipping())
        this.canvasContext.fillStyle = '#ff0000'
      else
        this.canvasContext.fillStyle = '#00ff00'

      // draw a bar based on the current volume
      this.canvasContext.fillRect(0, this.HEIGHT - (this._processor.volume * this.HEIGHT * 1.4), this.WIDTH, this._processor.volume * this.HEIGHT * 1.4)
      if (this._loopActive) {
        window.requestAnimationFrame(loop)
      }
    }
    window.requestAnimationFrame(loop)

  }

  volumeAudioProcess(event) {
    let buf = event.inputBuffer.getChannelData(0)
    let bufLength = buf.length
    let sum = 0
    let x

    // Do a root-mean-square on the samples: sum up the squares...
    for (let i = 0; i < bufLength; i++) {
      x = buf[i]
      if (Math.abs(x) >= this.clipLevel) {
        this.clipping = true
        this._astClip = window.performance.now()
      }
      sum += x * x
    }

    // ... then take the square root of the sum.
    var rms = Math.sqrt(sum / bufLength)

    // Now smooth this out with the averaging factor applied
    // to the previous sample - take the max here because we
    // want "fast attack, slow release."
    this.volume = Math.max(rms, this.volume * this.averaging)
    this.peakMeter._volume = this.volume
  }

  setProcessor(audioContext, clipLevel, averaging, clipLag) {
    let self = this
    self._processor = audioContext.createScriptProcessor(512)
    self._processor.onaudioprocess = self.volumeAudioProcess
    self._processor.clipping = true
    self._processor.lastClip = 0
    self._processor.volume = 0
    self._processor.clipLevel = clipLevel || 0.98
    self._processor.averaging = averaging || 0.95
    self._processor.clipLag = clipLag || 750
    self._processor.peakMeter = self

    // this will have no effect, since we don't copy the input to the output,
    // but works around a current Chrome bug.
    self._processor.connect(audioContext.destination)

    self._processor.checkClipping = () => {
      if (!this.clipping)
        return false
      if ((this.lastClip + this.clipLag) < window.performance.now())
        this.clipping = false
      return this.clipping
    }

    self._processor.shutdown = () => {
      this.disconnect()
      this.onaudioprocess = null
    }
    return self._processor
  }
  get volume() {
    return this._volume
  }

  set volume(v) {
    this._volume = v
  }

  get loop() {
    return this._loopActive
  }

  set loop(v) {
    this._loopActive = v
    if (v) {
      this.drawLoop()
    }
  }
  stop() {
    this._loopActive = false
    setTimeout(() => {
      this._volume = 0
      this.canvasContext.clearRect(0, 0, this.WIDTH, this.HEIGHT)
    }, 100)
  }
}