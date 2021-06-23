import AudioPeaks from '../waveform/audioPeaksClass.js'
import Draw from '../waveform/waveformDrawClass.js'
import EventEmitter from '../utils/eventEmitter.js'
import Grip from './gripClass.js'
import TrackPosition from './trackPosition.js'
import { append } from '../utils/dom'
import template from './trackClassTpl'

export default class Track2 extends EventEmitter {
	constructor(row, index, buffer, title, type, color, _pos = 0) {
		super()
		this._row = row
		this._buffer = buffer
		this._index = index
		this._title = title
		this._type = type
		this._color = color
		this._pos = window.SquyncEditor.zoom.pxToTime(_pos)
		this._domNode = document.getElementById('row-' + row)
		this._refs = append(this._domNode, template)

		let icons = {
			music: 'music_note',
			sound: 'surround_sound',
			voice: 'settings_voice'
		}
		let self = this

		window.SquyncEditor.zoom.duration

		this._timelinePosition = 0
		this._duration = this._buffer.duration
		this._loopPosition = 0
		this._locked = false
		this._selected = false

		// THE window contain playable track and comands
		this._windowLeft = window.SquyncEditor.zoom.timeToPx(this._pos)
		this._windowRight = window.SquyncEditor.zoom.timeToPx(this._pos) + window.SquyncEditor.zoom.timeToPx(this._duration)

		this._windowWidth = window.SquyncEditor.zoom.timeToPx(this._duration)
		this._windowPosition = new TrackPosition(window.SquyncEditor.zoom.scale, this._pos, this._duration)

		// THE container contain the complete original track
		this._trackBoxLeft = 0
		this._trackBoxWidth = window.SquyncEditor.zoom.timeToPx(this._duration)
		this._trackBoxPosition = new TrackPosition(window.SquyncEditor.zoom.scale, 0, this._duration)

		// DOM
		// main container
		this._refs.TrackBox.id = this._type + '-' + this._index
		this._refs.TrackBox.style.left = this._windowLeft + 'px'
		this._refs.TrackBox.style.width = this._windowWidth + 'px'
		// waveform
		this._refs.TrackBoxWaveform.style.left = this._trackBoxLeft + 'px'
		this._refs.TrackBoxWaveform.style.width = this._trackBoxWidth + 'px'
		// THE Commander is grip for move the track
		this._refs.TrackBoxMover.addEventListener('mousedown', this.handleCommanderMouseDown.bind(this))
		// track info
		this._refs.TrackBoxInfoText.innerText = this._title
		this._refs.TrackBoxInfoIcon.innerText = icons[this._type]
		// THE container for schifting the track ex ._windowContainer. now ._refs.TrackBoxOffset.
		this._refs.TrackBoxOffset.addEventListener('mousedown', this.handleWindowContainerMouseDown.bind(this))

		// this._refs.TrackBoxDrag.addEventListener('mousedown', this.dragMouseDownHandler.bind(this))
		let dragX = 0
		const dragHandler = e => {
			// console.log(e)
			let r = this._refs.TrackBoxDrag.getBoundingClientRect()
			dragX = e.offsetX
			e.dataTransfer.setData(
				'text/plain',
				JSON.stringify({
					ctrlKey: e.altKey,
					offset: e.pageX - r.x,
					index: this._index,
					mode: 'track'
				})
			)
			if (e.altKey) {
				this._refs.TrackBoxDragText.innerText = 'COPY'
			} else {
				this._refs.TrackBoxDragText.innerText = 'MOVE'
			}
			this._refs.TrackBoxDragText.visible = true
		}
		this._refs.TrackBoxDrag.addEventListener('dragstart', dragHandler.bind(this))

		this._refs.TrackBoxDrag.addEventListener('drag', event => {
			window.SquyncEditor.globals.emit('drag-target', event.clientX - dragX + window.SquyncEditor.globals.scrollPos, true)
		})
		const dragEndHandler = () => {
			// 'drag-end')
			window.SquyncEditor.globals.emit('drag-target', 0, false)
			this._refs.TrackBoxDragText.visible = false
		}
		this._refs.TrackBoxDrag.addEventListener('dragend', dragEndHandler.bind(this))

		const activatorHandle = () => {
			this.selected = true
		}
		this._refs.TrackBoxActivator.addEventListener('click', activatorHandle.bind(this))
		this._refs.TrackBoxActivator.visible = true

		this.setPeaks()

		// key down event

		// Grip left
		this.gripLeft = new Grip(this._domNode, this._windowLeft, this._windowRight - 5, this._windowLeft, 'left')
		this.gripLeft.on('change', () => {
			this._windowWidth = this._windowRight - this._windowLeft
			this._windowPosition.setPos(this._windowLeft, this._windowRight)
			this.sendInfo()
		})
		this.gripLeft.on('move', pos => {
			let maxRight = this._windowRight - 5
			let maxLeft = this._windowRight - (this._trackBoxWidth + this._trackBoxLeft)
			this._windowLeft = pos
			if (this._windowLeft > maxRight) {
				this._windowLeft = maxRight
				this.gripLeft.pos = this._windowLeft
			}
			if (this._windowLeft < maxLeft) {
				this._windowLeft = maxLeft
				this.gripLeft.pos = maxLeft
			}
			this._windowWidth = this._windowRight - this._windowLeft
			this._refs.TrackBox.style.left = this._windowLeft + 'px'
			this._refs.TrackBox.style.width = this._windowWidth + 'px'
			this.gripRight.setBounds(this._windowLeft + 5, this._windowLeft + this._trackBoxWidth + this._trackBoxLeft, this._windowRight)
			this.sendInfo()
		})

		let duration = this._duration
		let maxDuration = window.SquyncEditor.zoom.pxToTime(window.SquyncEditor.config.rowsContainer.clientWidth)
		if (window.SquyncEditor.videoStore.duration) {
			maxDuration = window.SquyncEditor.videoStore.duration
		}
		if (this._pos + this._duration > maxDuration) {
			duration = maxDuration - this._pos
		}
		this._windowWidth = window.SquyncEditor.zoom.timeToPx(duration)
		this._windowPosition = new TrackPosition(window.SquyncEditor.zoom.scale, this._pos, duration)
		this._refs.TrackBox.style.width = this._windowWidth + 'px'
		this._windowRight = window.SquyncEditor.zoom.timeToPx(this._pos) + window.SquyncEditor.zoom.timeToPx(duration)

		// grip right
		this.gripRight = new Grip(this._domNode, this._windowLeft + 5, this._windowRight, this._windowRight, 'right')
		this.gripRight.on('change', () => {
			this._windowWidth = this._windowRight - this._windowLeft
			this._windowPosition.setPos(this._windowLeft, this._windowRight)
			this.sendInfo()
		})
		this.gripRight.on('move', pos => {
			if (pos > this._windowLeft + this._trackBoxWidth + this._trackBoxLeft) {
				pos = this._windowLeft + this._trackBoxWidth + this._trackBoxLeft
			}
			if (pos < this._windowxLeft + 5) {
				pos = this._windowLeft + 5
			}
			if (pos > window.SquyncEditor.config.rowsContainer.clientWidth - 10) {
				pos = window.SquyncEditor.config.rowsContainer.clientWidth - 10
			}
			this._windowRight = pos
			this._windowWidth = this._windowRight - this._windowLeft
			this._refs.TrackBox.style.width = this._windowWidth + 'px'
			this.gripLeft.setBounds(0, this._windowRight - 5, this._windowLeft)
			this.sendInfo()
		})

		/// Globals

		window.SquyncEditor.globals.on('select-index', index => {
			self.selected = self._index === index
		})
		window.SquyncEditor.globals.on('play-track', (selected, index) => {
			if (self._index === index) {
				self.play(false)
			}
		})
		window.SquyncEditor.globals.on('select-track', index => {
			if (self._index !== index) {
				self.selected = false
			}
		})
		window.SquyncEditor.globals.on('reset-track', (selected, index) => {
			// console reset track
			console.log('TO DO reset-track', selected, index)
		})

		window.SquyncEditor.globals.on('lock-track', (index, locked) => {
			// console.log('lock-track', index, locked)
			if (self._index === index) {
				self._locked = locked
				if (self._locked) {
					self._refs.TrackBox.classList.add('locked')
					self._refs.TrackBox.selected = false
					self.disableGrips(true)
				} else {
					self._refs.TrackBox.classList.remove('locked')
					self._refs.TrackBox.selected = true
					self.disableGrips(false)
				}
				self.sendInfo()
			}
		})

		window.SquyncEditor.globals.on('move-track', (index, left) => {
			if (self._index === index) {
				self._pos = self._timelinePosition
				if (left) {
					self._windowLeft = window.SquyncEditor.zoom.timeToPx(self._pos) - self._windowWidth
				} else {
					self._windowLeft = window.SquyncEditor.zoom.timeToPx(self._pos)
				}
				if (self._windowLeft < 0) {
					self._windowLeft = 0
				}
				self._windowRight = self._windowLeft + self._windowWidth
				self._windowPosition.setPos(self._windowLeft, self._windowRight)
				self._refs.TrackBox.style.left = self._windowLeft + 'px'
				self.reboundGrips()
				self.sendInfo()
			}
		})

		window.SquyncEditor.globals.on('cut-track', index => {
			if (self._index === index) {
				let pos = window.SquyncEditor.zoom.timeToPx(self._timelinePosition)
				if (pos > self._windowLeft && pos < self._windowRight) {
					self._windowRight = pos
					self._windowWidth = self._windowRight - self._windowLeft
					self._refs.TrackBox.style.width = self._windowWidth + 'px'
					self._windowPosition.setPos(self._windowLeft, self._windowRight)
					self.reboundGrips()
					self.sendInfo()
				}
			}
		})

		// event marshall
		window.SquyncEditor.globals.on('zoom', data => {
			self.doZoom(data.scale)
		})

		window.SquyncEditor.globals.on('keydown', event => {
			self.handleKeyDown(event)
		})

		window.SquyncEditor.globals.on('position', position => {
			self._timelinePosition = position
		})

		// now select this track
		window.SquyncEditor.globals.emit('select-index', self._index)
		window.SquyncEditor.globals.emit('select-track', self._index)
	}

	////
	//// end constructor
	////

	getColor() {
		return `color-${this._index % 8}`
	}
	destroy() {
		this._domNode.removeChild(this._refs.root)
		this.gripLeft.destroy()
		this.gripRight.destroy()
	}

	setNewBuffer(pos, buffer) {
		this._buffer = buffer
		this._duration = this._buffer.duration
		this.resetPositions(pos, this._duration)
		this.setPeaks()
	}

	// end constructor

	select() {
		let self = this
		return new Promise((resolve, reject) => {
			let s = window.SquyncEditor.globals.playingTrack()
			if (s.playing) {
				// console.log('allready play')
				reject()
			} else {
				try {
					window.SquyncEditor.globals.setSelectedIndex(this._index)
					self.sendInfo()
					setTimeout(() => {
						resolve()
					}, 10)
				} catch (error) {
					console.log(error)
				}
			}
		})
	}

	get selected() {
		return this._selected
	}
	set selected(value) {
		if (value) {
			this._selected = true
			this._refs.TrackBox.selected = true
			window.SquyncEditor.globals.selectTrack({
				index: this._index,
				title: this._title,
				type: this._type,
				color: this._color,
				pos: this._pos,
				duration: this._duration,
				left: this._windowLeft,
				right: this._windowRight,
				locked: this._locked,
				offset: this.toMin(window.SquyncEditor.zoom.pxToTime(Math.abs(this._trackBoxLeft))),
				start: this.toMin(window.SquyncEditor.zoom.pxToTime(Math.abs(this._windowLeft))),
				end: this.toMin(window.SquyncEditor.zoom.pxToTime(Math.abs(this._windowRight)))
			})
			this._refs.TrackBoxActivator.visible = false
			this.reboundGrips()
		} else {
			this._refs.TrackBox.selected = false
			this._refs.TrackBoxActivator.visible = true
			this._selected = false
		}
		this.gripRight.selected = value
		this.gripLeft.selected = value
	}

	doZoom() {
		let pos = this._trackBoxPosition.setScale()
		this.setPeaks()
		this._trackBoxLeft = pos.left
		this._trackBoxWidth = pos.width
		this._refs.TrackBoxWaveform.style.left = this._trackBoxLeft + 'px'
		this._refs.TrackBoxWaveform.style.width = this._trackBoxWidth + 'px'
		pos = this._windowPosition.setScale()
		this._windowLeft = pos.left
		this._windowRight = pos.right
		this._windowWidth = pos.width
		this._refs.TrackBox.style.left = this._windowLeft + 'px'
		this._refs.TrackBox.style.width = this._windowWidth + 'px'
		this.reboundGrips()
	}
	reboundGrips() {
		let max = this._windowLeft + this._trackBoxWidth + this._trackBoxLeft
		this.gripLeft.setBounds(this._windowLeft, this._windowRight - 5, this._windowLeft)
		this.gripRight.setBounds(this._windowLeft + 5, max, this._windowRight)
		this.sendInfo()
	}
	disableGrips(value) {
		this.gripLeft.disable = value
		this.gripRight.disable = value
	}
	//
	//
	// WINDOW container for shift the entire track
	//
	//
	handleWindowContainerMouseDown(event) {
		let self = this
		let x = event.pageX
		let p = self._trackBoxLeft
		let w = self._windowWidth
		let mouseActive = true
		let selected = false

		const addListeners = () => {
			document.addEventListener('mousemove', MouseMove)
			document.addEventListener('mouseup', MouseUp)
		}

		const removeListeners = () => {
			document.removeEventListener('mousemove', MouseMove)
			document.removeEventListener('mouseup', MouseUp)
		}

		const MouseUp = () => {
			mouseActive = false
			removeListeners()
			if (selected) {
				self._refs.TrackBox.classList.remove('show')
				self._refs.TrackBox.classList.remove('shift')
				self._refs.TrackBoxOffset.classList.remove('down')
				self._refs.TrackBoxOffset.classList.remove(self.getColor())
				self._trackBoxPosition.setPos(self._trackBoxLeft, self._trackBoxWidth + self._trackBoxLeft)
				self.reboundGrips()
				self.disableGrips(false)
			}
		}

		const MouseMove = event => {
			let pos = p + (event.pageX - x)
			if (pos > 0) {
				pos = 0
			}
			if (pos + self._trackBoxWidth <= self._windowWidth || self._windowWidth < w) {
				self._windowWidth = self._trackBoxWidth + pos
				self._refs.TrackBox.style.width = self._windowWidth + 'px'
				self._windowRight = self._windowLeft + self._windowWidth
				self.reboundGrips()
			}

			self._refs.TrackBoxWaveform.style.left = pos + 'px'
			self._trackBoxLeft = pos
			self._trackBoxPosition.setPos(self._trackBoxLeft, self._trackBoxWidth + self._trackBoxLeft)
			self.sendInfo()
		}

		x = event.pageX
		this.select().then(
			() => {
				if (self._locked) {
					removeListeners()
				} else if (mouseActive) {
					addListeners()
					selected = true
					self._refs.TrackBoxOffset.classList.add('down')
					self._refs.TrackBoxOffset.classList.add(self.getColor())
					self._refs.TrackBox.classList.add('show')
					self._refs.TrackBox.classList.add('shift')
					self.disableGrips(true)
				}
			},
			() => {
				removeListeners()
			}
		)
	}
	//
	//
	// COMANDER
	// MOVE TRACK PLAY BOX
	//
	//
	handleCommanderMouseDown(event) {
		if (event.button === 2) {
			return
		}
		if (event.altKey) {
			this._dragBox.style.pointerEvents = 'auto'
			this._dragBox.classList.add('drop')
			return
		}
		// console.log('handleCommanderMouseDown', event.button)
		let self = this
		let x = event.pageX
		let p = self._windowLeft
		let mouseActive = true
		let selected = false
		let max = window.SquyncEditor.config.rowsContainer.clientWidth
		let min = 0
		let r = window.SquyncEditor.config.editorFrame.getBoundingClientRect()

		window.SquyncEditor.globals.emit('drag-target', p + r.x, true)

		const addListeners = () => {
			document.addEventListener('mousemove', CommanderMouseMove)
			document.addEventListener('mouseup', CommanderMouseUp)
		}

		const removeListeners = () => {
			document.removeEventListener('mousemove', CommanderMouseMove)
			document.removeEventListener('mouseup', CommanderMouseUp)
		}

		const CommanderMouseUp = () => {
			// console.log('handleCommanderMouseUp')
			mouseActive = false
			removeListeners()
			if (selected) {
				self._refs.TrackBox.classList.remove('down')
				self._refs.TrackBox.classList.remove('move')
				self._refs.TrackBoxMover.classList.remove('down')
				self._refs.TrackBoxMover.classList.remove(self.getColor())
				self._windowPosition.setPos(self._windowLeft, self._windowRight)
				self.reboundGrips()
				self.disableGrips(false)
			}
			window.SquyncEditor.globals.emit('drag-target', 0, false)
		}

		const CommanderMouseMove = event => {
			event.preventDefault()
			event.stopPropagation()

			let pos = p + (event.pageX - x)
			if (pos <= min) {
				pos = min
			}
			if (pos + self._windowWidth >= max) {
				pos = max - self._windowWidth
			}
			// verifica anche a destra
			self._windowLeft = pos
			self._windowRight = self._windowLeft + self._windowWidth
			self._refs.TrackBox.style.left = self._windowLeft + 'px'

			self.gripLeft.pos = self._windowLeft
			self.gripRight.pos = self._windowRight
			self.sendInfo()
			window.SquyncEditor.globals.emit('drag-target', self._windowLeft + r.x, true)
		}

		x = event.pageX
		this.select().then(
			() => {
				if (self._locked) {
					removeListeners()
				} else if (mouseActive) {
					addListeners()
					selected = true
					self._refs.TrackBoxMover.classList.add('down')
					self._refs.TrackBoxMover.classList.add(self.getColor())
					self._refs.TrackBox.classList.add('move')
					self.reboundGrips()
					self.disableGrips(true)
				}
			},
			() => {
				removeListeners()
			}
		)
	}
	toRemove_select(mode) {
		this._selected = mode
		if (mode) {
			this._refs.TrackBoxWaveform.classList.add('focus')
		} else {
			this._refs.TrackBoxWaveform.classList.remove('focus')
		}
	}
	sendInfo() {
		window.SquyncEditor.globals.selectTrack({
			index: this._index,
			title: this._title,
			type: this._type,
			color: this._color,
			pos: this._pos,
			duration: this._duration,
			left: this._windowLeft,
			right: this._windowRight,
			locked: this._locked,
			offset: this.toMin(window.SquyncEditor.zoom.pxToTime(Math.abs(this._trackBoxLeft))),
			start: this.toMin(window.SquyncEditor.zoom.pxToTime(Math.abs(this._windowLeft))),
			end: this.toMin(window.SquyncEditor.zoom.pxToTime(Math.abs(this._windowRight)))
		})
		window.SquyncEditor.globals.emit('track-moved', {
			row: this._row,
			index: this._index,
			left: this._windowLeft,
			right: this._windowRight
		})
	}
	//⇧
	toMin(time) {
		if (!time && time !== 0) {
			return '--:--.--'
		}
		var mins = ~~(time / 60)
		var secs = (time % 60).toFixed(2)
		return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs
	}
	moveTrack(offset) {
		let left = offset
		if (this._windowLeft + offset < 0) {
			return
		}
		this._windowLeft += left
		this._windowRight = this._windowLeft + this._windowWidth
		this._refs.TrackBox.style.left = this._windowLeft + 'px'
		this.gripLeft.pos = this._windowLeft
		this.gripRight.pos = this._windowRight
		this._windowPosition.setPos(this._windowLeft, this._windowRight)
		this.sendInfo()
	}
	handleKeyDown(event) {
		// key commands
		const keyCode = Object.freeze({
			left: 37,
			up: 38,
			right: 39,
			down: 40,
			space: 32,
			start: 83,
			shift: 16,
			tab: 9
		})
		if (!this.selected || event.altKey) return
		switch (event.keyCode) {
			case keyCode.left:
				this.moveTrack(-1)
				break

			case keyCode.right:
				this.moveTrack(1)
				break

			case keyCode.down:
				this.moveTrack(10 - (this._windowLeft % 10))
				break

			case keyCode.up:
				this.moveTrack(-(10 - (this._windowLeft % 10)))
				break

			case keyCode.space:
				this.play(event.shiftKey)
				break

			case keyCode.start:
				this._pos = this._timelinePosition
				if (event.shiftKey) {
					this._windowLeft = window.SquyncEditor.zoom.timeToPx(this._pos) - this._windowWidth
				} else {
					this._windowLeft = window.SquyncEditor.zoom.timeToPx(this._pos)
				}
				this._windowRight = this._windowLeft + this._windowWidth
				this._windowPosition.setPos(this._windowLeft, this._windowRight)
				this._refs.TrackBox.style.left = this._windowLeft + 'px'
				this.reboundGrips()
				break

			case keyCode.shift:
				this._loopPosition = this._timelinePosition
				break
		}
	}
	resetPositions(pos, duration) {
		this._duration = duration
		this._pos = pos
		this._windowLeft = window.SquyncEditor.zoom.timeToPx(this._pos)
		this._windowRight = window.SquyncEditor.zoom.timeToPx(this._pos) + window.SquyncEditor.zoom.timeToPx(this._duration)
		this._windowWidth = window.SquyncEditor.zoom.timeToPx(this._duration)
		this._windowPosition.setPos(this._windowLeft, this._windowRight)
		this._refs.TrackBox.style.left = this._windowLeft + 'px'
		this._refs.TrackBox.style.width = this._windowWidth + 'px'
		// THE container contain the complete original track
		this._trackBoxLeft = 0
		this._trackBoxWidth = window.SquyncEditor.zoom.timeToPx(this._duration)
		this._trackBoxPosition.setPos(this._trackBoxLeft, this._trackBoxWidth + this._trackBoxLeft)
		this._refs.TrackBoxWaveform.style.left = this._trackBoxLeft + 'px'
		this._refs.TrackBoxWaveform.style.width = this._trackBoxWidth + 'px'
		this.reboundGrips()
	}
	play(shift) {
		if (!shift) {
			this._loopPosition = 0
		} else {
			if (window.SquyncEditor.zoom.timeToPx(this._loopPosition) < this._windowLeft || window.SquyncEditor.zoom.timeToPx(this._loopPosition) > this._windowRight) {
				this._loopPosition = 0
			}
		}

		window.SquyncEditor.globals.emit(
			'play-singleTrack',
			this._buffer,
			this._index,
			window.SquyncEditor.zoom.pxToTime(this._windowLeft),
			window.SquyncEditor.zoom.pxToTime(Math.abs(this._trackBoxLeft)),
			window.SquyncEditor.zoom.pxToTime(this._windowRight - this._windowLeft),
			this._loopPosition
		)
	}
	getTiming() {
		return {
			start: window.SquyncEditor.zoom.pxToTime(this._windowLeft),
			offset: window.SquyncEditor.zoom.pxToTime(Math.abs(this._trackBoxLeft)),
			duration: window.SquyncEditor.zoom.pxToTime(this._windowRight - this._windowLeft)
		}
	}
	getPositions() {
		return {
			trackBoxLeft: this._trackBoxLeft,
			trackBoxWidth: this._trackBoxWidth,
			windowLeft: this._windowLeft,
			windowRight: this._windowRight
		}
	}
	setPositions(positions) {
		this._trackBoxLeft = positions.trackBoxLeft
		this._trackBoxWidth = positions.trackBoxWidth
		this._windowLeft = positions.windowLeft
		this._windowRight = positions.windowRight
		this._windowWidth = this._windowRight - this._windowLeft
		this._windowPosition.setPos(this._windowLeft, this._windowRight)

		this._refs.TrackBoxWaveform.style.left = this._trackBoxLeft + 'px'
		this._refs.TrackBoxWaveform.style.width = this._trackBoxWidth + 'px'
		this._refs.TrackBox.style.left = this._windowLeft + 'px'
		this._refs.TrackBox.style.width = this._windowWidth + 'px'
		this.reboundGrips()
	}
	setPeaks() {
		if (this._buffer) {
			let resolution = 44100 / (1 / window.SquyncEditor.zoom.scale)
			let audioPeeks = new AudioPeaks(true, 8)
			this._peeks = audioPeeks.getPeaks(resolution, this._buffer)
			Draw(this._refs.TrackBoxWaveform, this._peeks.data, 48, window.SquyncEditor.config.colors[this._index - 1])
		}
	}
}
