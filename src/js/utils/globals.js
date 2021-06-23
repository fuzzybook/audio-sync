'use strict'
import EventEmitter from './eventEmitter.js'

export default class Globals extends EventEmitter {
	constructor() {
		super()
		this._version = 'alpha 0.0'
		this._editor = window.SquyncEditor.config.editor
		this.uploadVoice = null
		// set tab index
		var tabIndexes = -1
		var focusable = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
		focusable.forEach(f => {
			if (f.tabIndex !== -1) {
				tabIndexes++
			}
		})
		this._editor.tabIndex = tabIndexes
		this._index = 0
		this._selectedIndex = 0
		this._scale = 0

		this._timelinePosition = {
			pos: 0,
			scroll: 0
		}

		this._playTrack = {
			index: 0,
			playing: false
		}
		this._selectedTrack = null
		this._tracks = 0

		this._bufferSize = 0

		this._metaLeftKey = false

		this._targetPos = 0

		this._user = null

		this._project = null

		this.initDom()
	}

	///

	///
	displayInfo() {
		// let domNode = window.SquyncEditor.config.demoConsole
		// domNode.innerHTML = `
		// pos: ${this._timelinePosition.pos.toFixed(2)}  scroll: ${this._timelinePosition.scroll.toFixed(2)}
		//  playing: ${this._playTrack.playing ? 'Y' : 'N'}  index: ${this._playTrack.index}
		//  buffer size: ${parseFloat(this._bufferSize / 1000000).toFixed(3)}M
		// `
		//selected track: <pre>${JSON.stringify(this._selectedTrack, null, 2)}</pre><br>
		// console.log(`
		// pos: ${this._timelinePosition.pos.toFixed(2)}  scroll: ${this._timelinePosition.scroll.toFixed(2)} playing: ${this._playTrack.playing ? 'Y' : 'N'}  index: ${this._playTrack.index} buffer size: ${parseFloat(this._bufferSize / 1000000).toFixed(3)}M
		// `)
	}

	initDom() {
		let self = this
		self._editor.addEventListener('keydown', event => {
			event.preventDefault()
			event.stopPropagation()
			// console.log('ctrlKey %o altKey %o event %o', event.ctrlKey, event.altKey, event)
			if (event.keyCode === 9) {
				if (self._selectedIndex++ >= self._index) {
					self._selectedIndex = 0
				}
				self.emit('select-index', self._selectedIndex)
			} else if (event.code === 'MetaLeft') {
				self._metaLeftKey = true
			} else {
				event.metaLeftKey = self._metaLeftKey
				self.emit('keydown', event)
			}
		})
		self._editor.addEventListener('keyup', event => {
			event.preventDefault()
			event.stopPropagation()
			if (event.code === 'MetaLeft') {
				self._metaLeftKey = false
			}
		})
	}

	selectTrack(track) {
		if (track) {
			this._selectedTrack = track
			this.emit('track-info')
			this.emit('select-track', track.index)
		}
		this.displayInfo()
	}

	get user() {
		return this._user
	}

	set user(user) {
		this._user = user
	}

	get project() {
		return this._project
	}

	set project(project) {
		this._project = project
	}

	get selectedTrack() {
		return this._selectedTrack
	}

	get targetPos() {
		return this._targetPos + this._timelinePosition.scroll
	}

	set targetPos(pos) {
		this._targetPos = pos
	}

	get scale() {
		return this._scale
	}

	set scale(scale) {
		this._scale = scale
	}

	get playing() {
		return this._playTrack.playing
	}

	set editor(editor) {
		this._editor = editor
	}

	getProjectData() {
		let data = null
		if (this._editor) {
			data = this._editor.getData()
		}
		return data
	}

	setProjectData(data) {
		console.log('setProjectData', data)
		return new Promise(resolve => {
			if (this._editor) {
				this._editor.setData(data).then(() => resolve())
			} else {
				resolve()
			}
		})
	}

	playingTrack() {
		return this._playTrack
	}

	playTrack(index, playing) {
		this.emit('play-single-track', index, playing)
		this._playTrack.index = index || 0
		this._playTrack.playing = playing || false
		this.displayInfo()
	}
	resetIndex() {
		this._index = 0
	}
	getNextIndex() {
		this._index++
		return this._index
	}
	setSelectedIndex(index) {
		this._selectedIndex = index
		this.emit('select-index', this._selectedIndex)
	}

	getPosition() {
		return {
			pos: this._timelinePosition.pos,
			scroll: this._timelinePosition.scroll
		}
	}

	setPosition(data) {
		this._timelinePosition.pos = data.pos || 0
		this._timelinePosition.scroll = data.scroll || 0
		// only for video
		this.emit('new-position', {
			pos: this._timelinePosition.pos,
			scroll: this._timelinePosition.scroll
		})
		// this.displayInfo()
	}
	set bufferSize(size) {
		this._bufferSize = size
	}
	get bufferSize() {
		return this._bufferSize
	}
	get scrollPos() {
		return this._timelinePosition.scroll
	}

	get timelineTime() {
		return window.SquyncEditor.zoom.pxToTime(this._timelinePosition.pos + this._timelinePosition.scroll)
	}

	get timelinePosition() {
		return window.SquyncEditor.zoom.pxToTime(this._timelinePosition.pos)
	}
	get tracks() {
		return this._tracks
	}
	set tracks(tracks) {
		// console.log('set tracks', tracks)
		this._tracks = tracks
	}
}
