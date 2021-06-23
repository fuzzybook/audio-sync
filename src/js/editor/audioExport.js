export default startRecMixer
const startRecMixer = (rows, duration) => {
	console.log('start recording')

	const sampleRate = 44100
	const numberOfChannels = 2
	let length
	window.SquyncEditor.OfflineAudioContext = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(numberOfChannels, sampleRate * duration, sampleRate)

	window.SquyncEditor.OfflineAudioContext.oncomplete = function(e) {
		length = window.SquyncEditor.OfflineAudioContext.length
		if (!length) {
			length = sampleRate * duration
		}
		window.SquyncEditor.videoStore.productionBuffer = bufferToURL(e.renderedBuffer, Math.ceil(length))
	}

	let gainNode = window.SquyncEditor.OfflineAudioContext.createGain()
	gainNode.connect(window.SquyncEditor.OfflineAudioContext.destination)
	let destination = gainNode
	let max = 0
	let startOffset = 0
	let maxIndex = 0
	let playlist = []
	for (let i in rows._rows) {
		if (rows._rows[i].tracks.length) {
			console.log(rows._rows[i].container.volumePoints)
			rows._rows[i].container.setAudioNodes(window.SquyncEditor.OfflineAudioContext, destination)
			rows._rows[i].tracks.map(t => {
				let source = window.SquyncEditor.OfflineAudioContext.createBufferSource()
				source.buffer = t.element._buffer
				source.onended = e => {
					// console.log('track end', e, maxIndex)
					if (e.currentTarget.editorId === maxIndex) {
						self._playing = false
						self._playingMixer = false
						window.SquyncEditor.globals.emit('play-mixer', false)
					}
				}
				rows._rows[i].container.connectAudioNode(source)
				// source.connect(destination)
				// console.log(t.element)
				source.editorId = t.element._index
				playlist.push({
					index: t.element._index,
					source: source,
					start: window.SquyncEditor.zoom.pxToTime(t.element._windowLeft),
					offset: window.SquyncEditor.zoom.pxToTime(Math.abs(t.element._trackBoxLeft)),
					duration: window.SquyncEditor.zoom.pxToTime(t.element._windowRight - t.element._windowLeft)
				})
				// console.log(window.SquyncEditor.zoom.pxToTime(t.element._windowLeft), window.SquyncEditor.zoom.pxToTime(Math.abs(t.element._trackBoxLeft)))
			})
		}
	}
	// console.log('playlist', playlist, shift)
	let offsetTime = window.SquyncEditor.OfflineAudioContext.currentTime

	for (let i in rows._rows) {
		if (rows._rows[i].tracks.length) {
			console.log(rows._rows[i].container.inersectVolumePos(0), offsetTime)
			let points = rows._rows[i].container.volumePoints
			let first = true
			let gain = 0.5
			points.map(p => {
				if (p.p >= offsetTime) {
					if (first) {
						first = false
						gain = rows._rows[i].container.inersectVolumePos(0).v
						rows._rows[i].container.destination.gain.setValueAtTime(gain, p.p - offsetTime)
					} else {
						rows._rows[i].container.destination.gain.linearRampToValueAtTime(Math.abs(1 - p.v), p.p - offsetTime)
					}
					// console.log('gain at %o %o', gain, p.p)
				} else {
					console.log('discard point', p)
				}
			})
		}
	}

	console.log(playlist)

	playlist.map(p => {
		let offset = startOffset
		if (0 < p.start + p.duration) {
			let s = p.start - 0
			if (s < 0) {
				p.offset += Math.abs(s)
				p.duration -= Math.abs(s)
				// console.log(Math.abs(s), p.offset + offset, p.duration)
				s = 0
			}
			// console.log(s, p.offset + offset, p.duration)
			p.source.start(s, p.offset + offset, p.duration)
			if (p.start + p.duration > max) {
				max = p.start + p.duration
				maxIndex = p.index
			}
		}
	})

	window.SquyncEditor.OfflineAudioContext.startRendering()
}

const bufferToURL = (abuffer, len) => {
	var numOfChan = abuffer.numberOfChannels,
		length = len * numOfChan * 2 + 44,
		buffer = new ArrayBuffer(length),
		view = new DataView(buffer),
		channels = [],
		i,
		sample,
		offset = 0,
		pos = 0

	// write WAVE header
	setUint32(0x46464952) // "RIFF"
	setUint32(length - 8) // file length - 8
	setUint32(0x45564157) // "WAVE"

	setUint32(0x20746d66) // "fmt " chunk
	setUint32(16) // length = 16
	setUint16(1) // PCM (uncompressed)
	setUint16(numOfChan)
	setUint32(abuffer.sampleRate)
	setUint32(abuffer.sampleRate * 2 * numOfChan) // avg. bytes/sec
	setUint16(numOfChan * 2) // block-align
	setUint16(16) // 16-bit (hardcoded in this demo)

	setUint32(0x61746164) // "data" - chunk
	setUint32(length - pos - 4) // chunk length

	// write interleaved data
	for (i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i))

	while (pos < length) {
		for (i = 0; i < numOfChan; i++) {
			// interleave channels
			sample = Math.max(-1, Math.min(1, channels[i][offset])) // clamp
			sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0 // scale to 16-bit signed int
			view.setInt16(pos, sample, true) // write 16-bit sample
			pos += 2
		}
		offset++ // next source sample
	}

	// create Blob
	return new Blob([buffer], { type: 'audio/wav' })

	function setUint16(data) {
		view.setUint16(pos, data, true)
		pos += 2
	}

	function setUint32(data) {
		view.setUint32(pos, data, true)
		pos += 4
	}
}
