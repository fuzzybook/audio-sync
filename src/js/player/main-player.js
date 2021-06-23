'use strict'
import Btn from '../utils/button'
import BtnToggle from '../utils/button-toggle'
import EventEmitter from '../utils/eventEmitter.js'
import ShowScenes from './show-scenes'
import ShowTracks from './show-tracks'
import NewScene from '../video/show-scenes-dialog'
import Mixer from '../mixer/show-mixer'
import Recorder from '../recorder/show-recorder'

export default class MainPlayer extends EventEmitter {
	constructor() {
		super()
		let self = this
		let domNode = window.SquyncEditor.config.mainPlayer
		self._row = document.createElement('div')
		self._row.classList.add('main-player')
		domNode.appendChild(self._row)

		let showScenesPopup = new ShowScenes()
		let showTracksPopup = new ShowTracks()
		let newScene = new NewScene()
		let mixer = new Mixer()
		let recorder = new Recorder()

		let play = new BtnToggle(self._row, null, 'play', 'play_arrow', 'pause')
		play.on('change', (selected, shift) => {
			self.emit('main-player-play', selected, shift)
		})

		let tostart = new Btn(self._row, null, 'play', 'stop')
		tostart.on('click', () => {
			window.SquyncEditor.globals.emit('main-player-reset')
		})

		let rewind = new Btn(self._row, null, 'play', 'fast_rewind')
		rewind.on('click', () => {
			window.SquyncEditor.globals.emit('prev-scene')
		})

		let forward = new Btn(self._row, null, 'play', 'fast_forward')
		forward.on('click', () => {
			window.SquyncEditor.globals.emit('next-scene')
		})

		self._rowTime = document.createElement('div')
		self._rowTime.classList.add('main-player-time')
		self._row.appendChild(self._rowTime)

		/// info

		self._infoRow = document.createElement('div')
		self._infoRow.classList.add('info-box')
		self._infoRow.classList.add('hide')
		self._row.appendChild(self._infoRow)

		let lock = new BtnToggle(self._infoRow, null, 'play', 'lock_open', 'lock')
		lock.on('change', selected => {
			window.SquyncEditor.globals.emit('lock-track', window.SquyncEditor.globals.selectedTrack.index, selected)
		})
		lock.selected = false

		let remove = new Btn(self._infoRow, null, 'play', 'delete_forever')
		remove.on('click', () => {
			if (window.SquyncEditor.globals.selectedTrack) {
				if (!window.SquyncEditor.globals.selectedTrack.locked) {
					window.SquyncEditor.globals.emit('remove-track', window.SquyncEditor.globals.selectedTrack.index)
				}
			}
		})

		let cut = new Btn(self._infoRow, null, 'play', 'statics/assets/scissors.svg', true)
		cut.on('click', () => {
			if (window.SquyncEditor.globals.selectedTrack) {
				if (!window.SquyncEditor.globals.selectedTrack.locked) {
					window.SquyncEditor.globals.emit('cut-track', window.SquyncEditor.globals.selectedTrack.index)
				}
			}
		})

		let toStart = new Btn(self._infoRow, null, 'play', 'first_page')
		toStart.on('click', () => {
			if (window.SquyncEditor.globals.selectedTrack) {
				if (!window.SquyncEditor.globals.selectedTrack.locked) {
					window.SquyncEditor.globals.emit('move-track', window.SquyncEditor.globals.selectedTrack.index, false)
				}
			}
		})

		let toEnd = new Btn(self._infoRow, null, 'play', 'last_page')
		toEnd.on('click', () => {
			if (window.SquyncEditor.globals.selectedTrack) {
				if (!window.SquyncEditor.globals.selectedTrack.locked) {
					window.SquyncEditor.globals.emit('move-track', window.SquyncEditor.globals.selectedTrack.index, true)
				}
			}
		})

		let copy = new Btn(self._infoRow, null, 'play', 'library_music')
		copy.on('click', event => {
			if (window.SquyncEditor.globals.selectedTrack) {
				if (!window.SquyncEditor.globals.selectedTrack.locked) {
					window.SquyncEditor.globals.emit('copy-track', window.SquyncEditor.globals.selectedTrack.index, event.altKey)
				}
			}
		})

		/* let edit = new Btn(self._infoRow, null, 'play', 'edit')
    edit.on('click', () => {
      if (window.SquyncEditor.globals.selectedTrack) {
        console.log('edit')
      }
    })
 */
		self._infoBox = document.createElement('div')
		self._infoBox.classList.add('info-text')
		self._infoRow.appendChild(self._infoBox)

		self._rowRight = document.createElement('div')
		self._rowRight.classList.add('main-player-right')
		self._row.appendChild(self._rowRight)

		let recorderBtn = new Btn(self._rowRight, null, 'play', 'record_voice_over')
		recorderBtn.on('click', event => {
			// alert no project
			recorder.show(event)
		})

		let mixerBtn = new Btn(self._rowRight, null, 'play', 'tune')
		mixerBtn.on('click', event => {
			mixer.show(event)
		})

		let addScenes = new Btn(self._rowRight, null, 'play', 'library_add')
		addScenes.on('click', () => {
			newScene.show()
		})

		let showScenes = new Btn(self._rowRight, null, 'play', 'video_library')
		showScenes.on('click', e => {
			showScenesPopup.show(e)
		})

		let showTracks = new Btn(self._rowRight, null, 'play', 'library_music')
		showTracks.on('click', e => {
			showTracksPopup.show(e)
		})

		let zoomIn = new Btn(self._rowRight, null, 'play', 'add_circle_outline')
		zoomIn.on('click', () => {
			window.SquyncEditor.globals.emit('zoom-dec')
		})

		let zoomOut = new Btn(self._rowRight, null, 'play', 'remove_circle_outline')
		zoomOut.on('click', () => {
			window.SquyncEditor.globals.emit('zoom-inc')
		})

		self._rowZoom = document.createElement('div')
		self._rowZoom.classList.add('main-player-zoom')
		self._rowRight.appendChild(self._rowZoom)

		window.SquyncEditor.globals.on('track-info', () => {
			// 'window.SquyncEditor.globals.selectedTrack', window.SquyncEditor.globals.selectedTrack)
			if (window.SquyncEditor.globals.selectedTrack) {
				self._infoRow.classList.remove('hide')
				self.buidSelectedTrackInfo(window.SquyncEditor.globals.selectedTrack)
				lock.setState(window.SquyncEditor.globals.selectedTrack.locked)
				if (window.SquyncEditor.globals.selectedTrack.locked) {
					remove._btn.classList.add('disabled')
					cut._btn.classList.add('disabled')
					toStart._btn.classList.add('disabled')
					toEnd._btn.classList.add('disabled')
				} else {
					remove._btn.classList.remove('disabled')
					cut._btn.classList.remove('disabled')
					toStart._btn.classList.remove('disabled')
					toEnd._btn.classList.remove('disabled')
				}
			} else {
				self._infoRow.classList.add('hide')
			}
		})

		window.SquyncEditor.globals.on('play-mixer', state => {
			play.selected = state
		})

		window.SquyncEditor.globals.on('track-removed-info', () => {
			self._infoRow.classList.add('hide')
		})

		window.SquyncEditor.globals.on('position', position => {
			self._rowTime.innerHTML = `<span>${self.toMin(position)}</span>`
		})

		self._rowTime.innerHTML = `<span>${self.toMin(0)}</span>`
	}

	buidSelectedTrackInfo(data) {
		if (!data) {
			this._infoBox.innerHTML = ''
		} else {
			let info = `<span class="title">${data.title}:</span><span class="time">${data.start} - ${data.end}</span>`
			if (data.offset !== '00:00.00') {
				info += `<span class="time"> offset: ${data.offset}</span>`
			}
			this._infoBox.innerHTML = info
		}
	}

	toMin(time) {
		var mins = ~~(time / 60)
		var secs = (time % 60).toFixed(2)
		return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs
	}
}
