import EventEmitter from '../utils/eventEmitter.js'
import Timeline from '../timeline/timelineClass.js'
import MainPlayer from '../player/main-player.js'
import Rows from './rows'
import RowsCommander from './comander-rows'
import Video from '../video/video'
import startRecMixer from './audioExport'
import bufferToURL from './bufferToUrl.js'

export default class AudioEditor extends EventEmitter {
	// connected to movie or self buffer default 300 seconds
	constructor() {
		super()
		this._domNode = window.SquyncEditor.config.editor
		// console.log(this._domNode)
		window.SquyncEditor.globals.editor = this
		this._rows = new Rows()
		this._commandRows = new RowsCommander()
		this._timeline = new Timeline()
		this._mainPlayer = new MainPlayer()
		this._videoPlayer = null

		this._timelinePosition = 0
		this._testing = null
		this._playing = false
		this._playingTest = false
		this._playingMixer = false
		this._playingOnlyVideo = false
		this._playlist = []
		this._testTrack = null
		this._time = 0
		this._gainNode = null
		this._destination = null
		this.init()
	}

	init() {
		let self = this
		self._mainPlayer.on('main-player-play', play => {
			if (play) {
				self.startPlayMixer()
			} else {
				self.stopPlayMixer()
			}
		})

		window.SquyncEditor.globals.on('main-player-reset', () => {
			if (self._playing) {
				if (self._playingTest) {
					self.stopTrack()
				}
				if (self._playingMixer) {
					self.stopPlayMixer()
				}
			}
			setTimeout(() => {
				self._timeline.resetPosition()
				self._offsetTime = self._audioCtx.currentTime
			}, 100)
		})

		self._timeline.on('changed-position', position => {
			self._timelinePosition = position
			self.emit('changed-position', position)
			if (!self._playing && !self._playingOnlyVideo) {
				if (window.SquyncEditor.videoStore.videoPresent) self._videoPlayer.pos = position
			}
		})

		window.SquyncEditor.globals.on('set-scene-position', pos => {
			self._timeline.moveSliderTo(pos, true)
			window.SquyncEditor.globals.setPosition({ pos: pos, scroll: self._timeline.scrollLeft })
			if (window.SquyncEditor.videoStore.videoPresent) self._videoPlayer.pos = pos
		})

		window.SquyncEditor.globals.on('track-moved', () => {
			window.SquyncEditor.globals.bufferSize = self._rows.getBuffersLenght()
		})

		window.SquyncEditor.globals.on('drop-file', track => {
			let pos = track.pos
			// console.log('drop-file', track)
			self.addTrack(track.row, track.uuid, track.url, track.title, track.type, pos)
		})

		window.SquyncEditor.globals.on('drop-track', track => {
			if (track.pos < window.SquyncEditor.zoom.timeToPx(window.SquyncEditor.globals.timelinePosition)) {
				track.pos = window.SquyncEditor.zoom.timeToPx(window.SquyncEditor.globals.timelinePosition)
			}
			window.SquyncEditor.globals.emit('drop-copy-track', track)
		})

		window.SquyncEditor.globals.on('remove-track', index => {
			self.removeTrack(index)
		})

		window.SquyncEditor.globals.on('play-singleTrack', (buffer, index, start, offset, duration, shift) => {
			self.playTrack(buffer, index, start, offset, duration, shift)
		})

		window.SquyncEditor.globals.on('keydown', event => {
			if (event.shiftKey && event.altKey && window.SquyncEditor.globals.selectedTrack) {
				switch (event.keyCode) {
					case 82: // R
						self.removeTrack(window.SquyncEditor.globals.selectedTrack.index)
						break
					case 68: // R
						break
				}
			}
		})

		window.SquyncEditor.globals.on('editor-open', isOpen => {
			window.SquyncEditor.globals.emit('volume-canvas', isOpen)
		})

		window.SquyncEditor.globals.on('add-original-track', url => {
			// console.log(buffer)
			self.addTrack('music01', 'original-audio', url, 'Movie audio', 'music', 0, self._audioCtx, null, true).then(index => {
				window.SquyncEditor.globals.emit('select-track', index)
			})
		})

		self.reset().then(() => {
			// audio context loop
			let requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame
			const loop = () => {
				let difference = 0
				if (self._audioCtx && self._playing) {
					if (Math.ceil(self._audioCtx.currentTime / window.SquyncEditor.scale) !== self._time) {
						self._time = Math.ceil(self._audioCtx.currentTime / window.SquyncEditor.scale)
						self._timeline.moveSliderTo(self._audioCtx.currentTime + self._offsetTime, self._testing, false)
						if (window.SquyncEditor.videoStore.videoPresent) {
							difference = Math.abs(self._videoPlayer.pos - (self._audioCtx.currentTime + self._offsetTime))
							if (difference > 0.2) {
								// 100ms adjustement savari allways .11 ms delay detect safari or best delay
								self._videoPlayer.pos = self._audioCtx.currentTime + self._offsetTime
								// console.log('difference ajusted ', difference)
							}
						}
					}
					window.SquyncEditor.globals.emit('position', self._audioCtx.currentTime + self._offsetTime)
					// self.emit('time-update', self._audioCtx.currentTime + self._offsetTime)
				} else if (window.SquyncEditor.videoStore.videoPresent && self._playingOnlyVideo) {
					if (!isNaN(self._videoPlayer.pos)) {
						if (Math.ceil(self._videoPlayer.pos / window.SquyncEditor.scale) !== self._time) {
							self._time = Math.ceil(self._videoPlayer.pos / window.SquyncEditor.scale)
							self._timeline.moveSliderTo(self._videoPlayer.pos, self._testing, false)
						}
					} else {
						self._time = -1
					}
				} else {
					self._time = -1
				}
				requestAnimationFrame(loop)
			}
			requestAnimationFrame(loop)
		})
		// set the size manager
		window.SquyncEditor.sizes.reBuild()

		// window.SquyncEditor.sizes.on('resized', sizes => {
		// console.log('Sizes: %o', sizes)
		// })

		window.SquyncEditor.globals.on('video-audio-extracted', () => {
			// console.log('video-audio-extracted')
			this._rows.setOriginalAudioTrack(this._audioCtx)
		})
	}

	getTrackBlob(row, track) {
		let t = this._rows._rows[row].tracks[track]
		return bufferToURL(t.bufferOriginal, t.bufferOriginal.length)
	}

	getData() {
		let data = { rows: null, scenes: null, zoom: null }
		data.rows = this._rows.getData()
		data.scenes = window.SquyncEditor.videoStore.scenes
		data.zoom = window.SquyncEditor.zoom.zoom
		return data
	}

	setData(data) {
		return new Promise(resolve => {
			// do zoom settings
			window.SquyncEditor.zoom.resetZoom(data.zoom.zoom)
			if (data.rows) {
				this._rows.setData(data.rows, this._audioCtx).then(() => {
					if (data.scenes) {
						window.SquyncEditor.videoStore.scenes = data.scenes
					}
					resolve()
				})
			} else {
				resolve()
			}
		})
	}

	resetVideoSizes(sizes) {
		if (this._videoPlayer) {
			this._videoPlayer.resetSize(sizes)
		}
	}

	attachVideo(node, size) {
		this._videoPlayer = new Video(node, size)
		const videoHandler = info => {
			this._timeline.resize(window.SquyncEditor.zoom.timeToPx(info.duration))
			window.SquyncEditor.globals.emit('new-video', info.duration)
		}
		this._videoPlayer.on('new-video', videoHandler.bind(this))
	}
	//sync player

	recordMixer() {
		let duration = window.SquyncEditor.videoStore.duration || window.SquyncEditor.zoom.duration
		startRecMixer(this._rows, duration)
	}

	startPlayOnlyVideo() {
		if (window.SquyncEditor.videoStore.videoPresent) {
			this._playingOnlyVideo = true
			window.SquyncEditor.globals.emit('play-mixer', true)
			window.SquyncEditor.globals.emit('new-popup', '')
		}
	}

	stopPlayOnlyVideo() {
		this._playingOnlyVideo = false
		window.SquyncEditor.globals.emit('play-mixer', false)
	}

	hasSolo() {
		for (let i in this._rows._rows) {
			if (this._rows._rows[i].container.solo) {
				return i
			}
		}
		return null
	}

	startPlayMixer() {
		let self = this
		self._playing = false
		self._playingMixer = false
		self._playingOnlyVideo = false

		if (window.SquyncEditor.videoStore.videoPresent) {
			self._videoPlayer.pos = window.SquyncEditor.globals.timelinePosition
		}

		if (window.SquyncEditor.globals.tracks < 1) {
			if (window.SquyncEditor.videoStore.videoPresent) {
				self._playingOnlyVideo = true
				window.SquyncEditor.globals.emit('play-mixer', true)
			}
		} else {
			self.reset().then(() => {
				let playable = false
				let max = 0
				let maxIndex = 0
				self._playlist = []
				let hasSolo = false
				let solo = self.hasSolo()
				if (solo) {
					hasSolo = true
				}

				for (let i in self._rows._rows) {
					if (self._rows._rows[i].tracks.length && !self._rows._rows[i].container.muted) {
						if (!hasSolo || solo === i) {
							playable = true
							// console.log(self._rows._rows[i].container.volumePoints)
							self._rows._rows[i].container.setAudioNodes(self._audioCtx, self._destination)
							self._rows._rows[i].tracks.map(t => {
								let source = self._audioCtx.createBufferSource()
								source.buffer = t.element._buffer
								source.onended = e => {
									// console.log('track end', e, maxIndex)
									if (e.currentTarget.editorId === maxIndex) {
										self._playing = false
										self._playingMixer = false
										window.SquyncEditor.globals.emit('play-mixer', false)
									}
								}
								self._rows._rows[i].container.connectAudioNode(source)
								// source.connect(self._destination)
								// console.log(t.element)
								source.editorId = t.element._index
								self._playlist.push({
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
				}
				if (!playable) {
					if (window.SquyncEditor.videoStore.videoPresent) {
						self._playingOnlyVideo = true
						window.SquyncEditor.globals.emit('play-mixer', true)
					}
					return
				}
				// console.log('playlist', self._playlist, shift)
				let startOffset = self._audioCtx.currentTime
				let started = 0
				self._offsetTime = self._timeline.pos + self._audioCtx.currentTime

				for (let i in self._rows._rows) {
					if (self._rows._rows[i].tracks.length) {
						// console.log(self._rows._rows[i].container.inersectVolumePos(self._timeline.pos), self._offsetTime)
						let points = self._rows._rows[i].container.volumePoints
						let first = true
						let gain = 0.5
						points.map(p => {
							if (p.p >= self._offsetTime) {
								if (first) {
									first = false
									gain = self._rows._rows[i].container.inersectVolumePos(self._timeline.pos).v
									self._rows._rows[i].container.destination.gain.setValueAtTime(gain, p.p - self._offsetTime)
								} else {
									self._rows._rows[i].container.destination.gain.linearRampToValueAtTime(Math.abs(1 - p.v), p.p - self._offsetTime)
								}
								// console.log('gain at %o %o', gain, p.p)
							} else {
								console.log('discard point', p)
							}
						})
					}
				}

				self._playlist.map(p => {
					let offset = startOffset
					if (self._timeline.pos < p.start + p.duration) {
						let s = p.start - self._timeline.pos
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
						started++
					}
				})
				if (started > 0) {
					self._playing = true
					self._playingMixer = true
					window.SquyncEditor.globals.emit('play-mixer', true)
					window.SquyncEditor.globals.emit('new-popup', '')
				}
			})
		}
	}

	stopPlayMixer() {
		let self = this
		// console.log('will stop', self._playlist)
		self._playingOnlyVideo = false
		window.SquyncEditor.globals.emit('play-mixer', false)

		if (window.SquyncEditor.globals.tracks > 0) {
			try {
				if (self._playing) {
					self._playlist.map(p => {
						// console.log('stop', p)
						p.source.stop()
					})
				}
			} catch (e) {
				self.reset().then(() => {
					console.log('recover error, e')
				})
			}
		}
		self._playing = false
		self._playingMixer = false
	}

	reset() {
		return new Promise(resolve => {
			if (this._audioCtx) {
				this._audioCtx.close()
			}
			// var AudioContext = window.AudioContext || window.webkitAudioContext
			this._audioCtx = new window.pastelleAudioContext({
				latencyHint: 'interactive',
				sampleRate: 44100
			})

			this._gainNode = this._audioCtx.createGain()
			this._gainNode.connect(this._audioCtx.destination)
			this._destination = this._gainNode

			this._playing = false
			this._time = 0
			this._offsetTime = 0

			resolve()
		})
	}

	selectTrack(index) {
		window.SquyncEditor.globals.setSelectedIndex(index)
	}

	initTrack(buffer, start, offset, duration, loopPosition) {
		let self = this
		self.reset().then(() => {
			self._testTrack.source = self._audioCtx.createBufferSource()
			self._testTrack.source.buffer = buffer
			// --console.log(self._testTrack.row)
			self._rows._rows[self._testTrack.row].container.setAudioNodes(self._audioCtx, self._destination)
			self._rows._rows[self._testTrack.row].container.connectAudioNode(self._testTrack.source)
			//self._testTrack.source.connect(self._commandRows._rows[self._testTrack.row].destination)
			self._testTrack.source.onended = () => {
				// --console.log('ended', self._audioCtx.currentTime - self._offsetTime)
				let vuMeter = self._rows._rows[self._testTrack.row].container.vuMeter
				vuMeter.stop()
				self._playing = false
				self._testing = null
				self._playingTest = false
				window.SquyncEditor.globals.emit('play-test', false)
				window.SquyncEditor.globals.playTrack(self._testTrack.index, self._playing)
			}
			if (loopPosition) {
				offset += loopPosition - start
				duration -= loopPosition - start
				self._offsetTime = self._audioCtx.currentTime + loopPosition
			} else {
				self._offsetTime = self._audioCtx.currentTime + start
			}
			self._testTrack.source.start(self._audioCtx.currentTime, offset, duration)
			self._testing = {
				start: start,
				loopPosition: loopPosition,
				duration: duration
			}
			self._playing = true
			self._playingTest = true
			window.SquyncEditor.globals.emit('play-test', true, start)
			window.SquyncEditor.globals.playTrack(self._testTrack.index, self._playing)
			// --console.log('play', loopPosition, start)
		})
	}

	stopTrack() {
		if (this._playing && this._testTrack.source) {
			this._testTrack.source.stop()
			this._playing = false
			this._playingTest = false
			window.SquyncEditor.globals.emit('play-test', false)
			let vuMeter = this._rows._rows[this._testTrack.row].container.vuMeter
			vuMeter.stop()
		}
		window.SquyncEditor.globals.playTrack(this._testTrack.index, this._playing)
	}

	playTrack(buffer, index, start, offset, duration, shift) {
		let self = this
		// --console.log('duration', buffer.duration, start, offset, duration)
		if (!self._testTrack) {
			self._testTrack = self._rows.getTrackByIndex(index)
		}
		if (self._testTrack.element._index !== index) {
			self._testTrack = self._rows.getTrackByIndex(index)
		}
		if (!self._playing) {
			self.initTrack(buffer, start, offset, duration, shift)
		} else if (self._playing && self._testTrack.source) {
			self.stopTrack()
		} else {
			// --console.log('error track play')
		}
	}

	removeTrack(index) {
		this._rows.removeTrack(index)
	}

	addTrack(row, uuid, url, title, type, position = 0) {
		return this._rows.addTrack(row, uuid, url, title, type, position, this._audioCtx)
	}

	resetBk() {
		this._rows.resetBk()
	}

	hasChanged() {
		return this._rows.hasChanged()
	}
}
