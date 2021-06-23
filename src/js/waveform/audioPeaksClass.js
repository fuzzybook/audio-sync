/**
* @param {Boolean} isMono - true = mono
*/
export default class AudioPeaks {
  constructor(isMono, bits) {
    this._bits = bits || 8
    if (isMono === null || isMono === undefined) {
      this._isMono = true
    }
    else {
      this._isMono = isMono
    }
    if ([8, 16, 32].indexOf(bits) < 0) {
      throw new Error('Invalid number of bits specified for peaks.')
    }
  }
  /**
  * @param {AudioBuffer,TypedArray} source - Source of audio samples for peak calculations.
  * @param {Number} cueIn - index in channel to start peak calculations from.
  * @param {Number} cueOut - index in channel to end peak calculations from (non-inclusive).
  */
  getPeaks(_samplesPerPixel, source, cueIn, cueOut) {
    let samplesPerPixel = _samplesPerPixel || 10000
    let numChan = source.numberOfChannels
    let peaks = []
    let c
    let numPeaks
    let channel
    let slice

    if (typeof source.subarray === 'undefined') {
      for (c = 0; c < numChan; c++) {
        channel = source.getChannelData(c)
        cueIn = cueIn || 0
        cueOut = cueOut || channel.length
        slice = channel.subarray(cueIn, cueOut)
        peaks.push(this.extractPeaks(slice, samplesPerPixel, this._bits))
      }
    }
    else {
      cueIn = cueIn || 0
      cueOut = cueOut || source.length
      peaks.push(this.extractPeaks(source.subarray(cueIn, cueOut), samplesPerPixel, this._bits))
    }

    if (this._isMono && peaks.length > 1) {
      peaks = this.makeMono(peaks, this._bits)
    }

    numPeaks = peaks[0].length / 2

    return {
      length: numPeaks,
      data: peaks,
      bits: this._bits
    }
  }

  makeMono(channelPeaks, bits) {
    let numChan = channelPeaks.length
    let weight = 1 / numChan
    let numPeaks = channelPeaks[0].length / 2
    let c = 0
    let i = 0
    let min
    let max
    let peaks
    switch (bits) {
      case 8:
        peaks = new Int8Array(numPeaks * 2)
        break
      case 16:
        peaks = new Int16Array(numPeaks * 2)
        break
      case 32:
        peaks = new Int32Array(numPeaks * 2)
        break
      default:
        peaks = new Int8Array(numPeaks * 2)
    }

    for (i = 0; i < numPeaks; i++) {
      min = 0
      max = 0

      for (c = 0; c < numChan; c++) {
        min += weight * channelPeaks[c][i * 2]
        max += weight * channelPeaks[c][i * 2 + 1]
      }

      peaks[i * 2] = min
      peaks[i * 2 + 1] = max
    }

    //return in array so channel number counts still work.
    return [peaks]
  }
  /**
  * @param {TypedArray} channel - Audio track frames to calculate peaks from.
  * @param {Number} samplesPerPixel - Audio frames per peak
  */
  extractPeaks(channel, samplesPerPixel, bits) {
    let i
    let chanLength = channel.length
    let numPeaks = Math.ceil(chanLength / samplesPerPixel)
    let start
    let end
    let segment
    let max
    let min
    let extrema

    //create interleaved array of min,max
    let peaks
    switch (bits) {
      case 8:
        peaks = new Int8Array(numPeaks * 2)
        break
      case 16:
        peaks = new Int16Array(numPeaks * 2)
        break
      case 32:
        peaks = new Int32Array(numPeaks * 2)
        break
      default:
        peaks = new Int8Array(numPeaks * 2)
    }

    for (i = 0; i < numPeaks; i++) {
      start = i * samplesPerPixel
      end = (i + 1) * samplesPerPixel > chanLength ? chanLength : (i + 1) * samplesPerPixel

      segment = channel.subarray(start, end)
      extrema = this.findMinMax(segment)
      min = this.convert(extrema.min, bits)
      max = this.convert(extrema.max, bits)

      peaks[i * 2] = min
      peaks[i * 2 + 1] = max
    }

    return peaks
  }
  /**
  * @param {Number} n - peak to convert from float to Int8, Int16 etc.
  * @param {Number} bits - convert to #bits two's complement signed integer
  */
  convert(n, bits) {
    let max = Math.pow(2, bits - 1)
    let v = n < 0 ? n * max : n * max - 1
    return Math.max(-max, Math.min(max - 1, v))
  }
  /**
  * @param {TypedArray} array - Subarray of audio to calculate peaks from.
  */
  findMinMax(array) {
    let min = Infinity
    let max = -Infinity
    let i = 0
    let len = array.length
    let curr

    for (; i < len; i++) {
      curr = array[i]
      if (min > curr) {
        min = curr
      }
      if (max < curr) {
        max = curr
      }
    }

    return {
      min: min,
      max: max
    }
  }
}