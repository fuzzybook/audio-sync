/*
 * virtual-dom hook for drawing to the canvas element.
 */
const __draw = (canvas, peaks, offset, bits, color) => {
  // --console.log
  const len = canvas.width
  const cc = canvas.getContext('2d')
  const h2 = canvas.height / 2
  const converter = h2 / Math.pow(2, bits - 1)

  cc.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
  cc.fillStyle = color
  cc.strokeStyle = color
  // cc.translate(0.5, 0.5);
  cc.lineWidth = 1
  cc.beginPath()
  cc.globalAlpha = 0.3
  cc.moveTo(0, h2 + 0.5)
  cc.lineTo(len, h2 + 0.5)
  cc.stroke()
  cc.globalAlpha = 1
  for (let i = 0; i < len; i++) {
    const minPeak = Math.abs(peaks[(i + offset) * 2] * converter)
    const maxPeak = Math.abs(peaks[(i + offset) * 2 + 1] * converter)
    // draw
    if (i % 2) cc.fillRect(i, h2 - maxPeak, 1, maxPeak + minPeak)
  }
}

const drawCanvas = (domNode, data, height, color) => {
  const MAX_CANVAS_WIDTH = 8192
  const width = data[0].length / 2
  // const playbackX = secondsToPixels(data.playbackSeconds, data.resolution, data.sampleRate)
  // const startX = secondsToPixels(this.startTime, data.resolution, data.sampleRate)
  // const endX = secondsToPixels(this.endTime, data.resolution, data.sampleRate)

  let offset = 0
  let totalWidth = width
  const peaks = data[0]
  while (domNode.firstChild) {
    domNode.removeChild(domNode.firstChild)
  }
  domNode.style.width = peaks.length + 'px'
  while (totalWidth > 0) {
    const currentWidth = Math.min(totalWidth, MAX_CANVAS_WIDTH)
    let canvas = document.createElement('canvas')
    canvas.setAttribute('width', currentWidth)
    canvas.setAttribute('height', height)
    canvas.setAttribute('style', 'padding: 0; z-index: 6003;')
    domNode.appendChild(canvas)
    __draw(canvas, peaks, offset, 8, color)
    totalWidth -= currentWidth
    offset += MAX_CANVAS_WIDTH
  }
}

export default drawCanvas