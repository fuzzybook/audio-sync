'use strict'
import EventEmitter from '../utils/eventEmitter.js'
import BtnRecord from './button-record'
import Btn from '../utils/button'
import Recorder from './recorder'
import PromptVoiceName from './prompt-name'
import { render } from '../utils/dom'
export default class RecorderPopUp extends EventEmitter {
	constructor() {
		super()
		let recorder = document.getElementById('recorder')
		if (recorder) {
			while (recorder.firstChild) {
				recorder.removeChild(recorder.firstChild)
			}
		} else {
			var body = document.getElementsByTagName('BODY')[0]
			let div = document.createElement('div')
			div.id = 'recorder'
			body.prepend(div)
		}
		let self = this
		this._name = 'recorder'
		this._status = {
			locked: false
		}
		this._url = null

		this._menu = document.createElement('div')
		this._menu.id = 'recorder-popup-box'
		this._menu.classList.add('recorder-popup-box')
		this._menu.classList.add('not-enabled')

		this._play = null
		this._save = null
		this._recording = false
		this._mixerPlayer = null
		this._recordButton = null
		this._recordTime = null
		this._recordsList = null
		this._analyzer = null
		this._position = { pos: 0, scroll: 0 }
		this._blob = null

		this._index = -1
		this._id = null
		this._visible = false

		this._menu.addEventListener('click', event => {
			event.preventDefault()
			event.stopPropagation()
		})

		this.buildHeader()
		this.audioContext = new window.pastelleAudioContext()
		this._recorder = new Recorder(this.audioContext, {
			// An array of 255 Numbers
			// You can use this to visualize the audio stream
			// If you use react, check out react-wave-stream
			onAnalysed: data => {
				// if (data.lineTo) console.log(data)
				if (self._recording) {
					self.draw(data.data, self._recording)
					self._recordTime.innerHTML = ((performance.now() - self._startTime) / 1000).toFixed(2)
				}
			}
		})
		navigator.mediaDevices
			.getUserMedia({ audio: true })
			.then(stream => this._recorder.init(stream))
			.catch(err => console.log('Uh oh... unable to get stream...', err))

		/* let deleteBtn = new Btn(this._deleteBox, null, 'delete', 'delete')
    deleteBtn.on('click', () => {
      window.SquyncEditor.globals.emit('volume-delete', this._index, this._id)
    }) */

		this._play = new BtnRecord(this._playButton, 'play_arrow', 'stop')
		this._play.disabled = true
		this._play.on('change', selected => {
			if (selected) {
				if (this._url) {
					window.SquyncEditor.audioEditor.startPlayOnlyVideo()
					this._mixerPlayer.src = this._url
					this._mixerPlayer.play()
				}
			} else {
				window.SquyncEditor.audioEditor.stopPlayOnlyVideo()
				this._mixerPlayer.stop()
			}
		})

		this._mixerPlayer.addEventListener('ended', () => {
			this._play.selected = false
		})

		this._save = new Btn(this._saveButton, '', 'record-btn', 'save')
		this._save.disabled = true
		this._save.on('click', () => {
			PromptVoiceName.show('Save voice', 'Type a name for this voice record.', result => {
				if (result) {
					if (typeof window.SquyncEditor.globals.uploadVoice === 'function') {
						window.SquyncEditor.globals.uploadVoice(this._blob).then(
							data => {
								console.log(data)
								window.SquyncEditor.audioEditor.addTrack('voice', data.uuid, data.url, result, 'voice', this._position.pos)
								window.SquyncEditor.globals.emit('set-scene-position', window.SquyncEditor.zoom.pxToTime(this._position.pos))
								this._recordTime.innerHTML = ''
								this._play.disabled = true
								this._save.disabled = true
							},
							error => {
								console.log('record error', error)
								this._recordTime.innerHTML = ''
								this._play.disabled = true
								this._save.disabled = true
							}
						)
					}
				}
			})
		})

		let rec = new BtnRecord(this._recordButton, 'mic', 'mic', 'recorder')
		rec.on('change', selected => {
			if (selected) {
				if (this._url) {
					window.URL.revokeObjectURL(this._url)
				}
				window.SquyncEditor.audioEditor.startPlayOnlyVideo()
				this._position = window.SquyncEditor.globals.getPosition()
				this._recorder.start()
				this._recording = true
				this._play.disabled = true
				this._save.disabled = true
				this._analyzer.classList.add('recording')
				this._startTime = performance.now()
				this._menu.classList.add('show')
			} else {
				this._recorder.stop().then(buffer => {
					this._blob = buffer.blob
					window.SquyncEditor.audioEditor.stopPlayOnlyVideo()
					this._url = window.URL.createObjectURL(buffer.blob)
					this._play.disabled = false
					this._save.disabled = false
					this._recording = false
					this._analyzer.classList.remove('recording')
					this.clearDrawRect()
				})
			}
		})

		document.getElementById('recorder').appendChild(this._menu)

		window.SquyncEditor.globals.on('records-popup', show => {
			if (!show && this._menu.classList.contains('show')) {
				this._menu.classList.remove('show')
			}
		})

		window.SquyncEditor.globals.on('new-popup', name => {
			if (name !== this._name) {
				this._menu.classList.remove('show')
			}
		})
	}

	get status() {
		return this._status
	}

	buildHeader() {
		let { mixerList, commandBox, analyzer, recordButton, recordTime, playButton, saveButton, mixerPlayer } = render(
			this._menu,
			`
      <div editor-ref="commandBox">
        <div editor-ref="recordButton"></div>
        <span editor-ref="recordTime"></span>
        <div class="play-save">
          <div editor-ref="playButton"></div>
          <div editor-ref="saveButton"></div>
        </div>
        <audio editor-ref="mixerPlayer"></audio>
      </div>
      <div editor-ref="recordsList">
       <canvas editor-ref="analyzer" width="288" height="100" />
      </div>
      <div class="triangle"><div>
    `
		)
		this._recordsList = mixerList
		this._commandBox = commandBox
		this._recordButton = recordButton
		this._recordTime = recordTime
		this._playButton = playButton
		this._saveButton = saveButton
		this._mixerPlayer = mixerPlayer
		this._analyzer = analyzer
	}

	getRelativeMousePosition(event) {
		let target = event.target
		var rect = target.getBoundingClientRect()

		return {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		}
	}

	show(event) {
		this._menu.style.left = '-300px'
		console.log('show')
		if (this._menu.classList.contains('show')) {
			window.SquyncEditor.globals.emit('records-popup', false)
		} else {
			if (this._url) {
				window.URL.revokeObjectURL(this._url)
			}
			this._recordTime.innerHTML = ''
			this._play.disabled = true
			this._save.disabled = true
			this._menu.classList.add('show')
			window.SquyncEditor.globals.emit('select-track', -1)
			setTimeout(() => {
				//console.log(event.target.getBoundingClientRect(), this._menu.getBoundingClientRect())
				let r = event.target.getBoundingClientRect()
				let centerX = r.x - this._menu.clientWidth / 2 + r.width / 2
				let centerY = r.y - this._menu.clientHeight - 20
				this._menu.style.left = centerX + 'px'
				this._menu.style.top = centerY + 'px'
				window.SquyncEditor.globals.emit('records-popup', true)
				window.SquyncEditor.globals.emit('new-popup', this._name)
			}, 100)
		}
	}

	clearDrawRect() {
		const canvas = this._analyzer
		const height = canvas.height
		const width = canvas.width
		const context = canvas.getContext('2d')
		context.clearRect(0, 0, width, height)
	}

	draw(audioData, recording) {
		const canvas = this._analyzer
		const height = canvas.height
		const width = canvas.width
		const context = canvas.getContext('2d')
		let x = 0
		const sliceWidth = (width * 1.0) / audioData.length
		context.lineWidth = 2
		if (recording) {
			context.strokeStyle = '#ffffff'
		} else {
			context.strokeStyle = '#cccccc'
		}
		context.clearRect(0, 0, width, height)
		context.beginPath()
		context.moveTo(0, height)
		for (const item of audioData) {
			const y = (item / 255.0) * height
			context.lineTo(x, height - y)
			x += sliceWidth
		}
		context.lineTo(x, height)
		context.stroke()
	}
}
