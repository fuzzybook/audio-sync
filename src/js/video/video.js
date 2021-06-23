'use strict'
import EventEmitter from '../utils/eventEmitter.js'
import { render } from '../utils/dom'

export default class Video extends EventEmitter {
	constructor(node, sizes) {
		super()
		window.SquyncEditor.sizes.maxVideoSizes = sizes
		this._domNode = node
		this.refs = this.init()
		this._videoPos = 0
		this._canPlay = false
		this._imageAcquisition = false
		this._maxHeight = sizes.height

		this.refs.videoPlayer.addEventListener('canplay', this.handleCanPlay.bind(this))
		this.refs.videoPlayer.addEventListener('loadedmetadata', this.handleLoadedMetadata.bind(this))
		this.refs.videoPlayer.addEventListener('ended', this.handleEnded.bind(this))
		const videoErrorHandler = event => {
			let error = event
			// Chrome v60
			if (event.path && event.path[0]) {
				error = event.path[0].error
			}
			// Firefox v55
			if (event.originalTarget) {
				error = error.originalTarget.error
			}
			console.log(`Video error: ${error.message}`)

			this.resetVideo()
		}
		this.refs.videoPlayer.addEventListener('error', videoErrorHandler.bind(this))

		const addSceneHandler = data => {
			data.pos = this._videoPos
			window.SquyncEditor.videoStore.addScene(data)
		}
		window.SquyncEditor.globals.on('add-scene', addSceneHandler.bind(this))

		const playMixerHandler = state => {
			if (window.SquyncEditor.videoStore.videoPresent) {
				if (state) {
					// console.log('start video player')
					this.refs.videoPlayer.currentTime = window.SquyncEditor.videoStore.videoPosition
					this.refs.videoPlayer.play()
				} else {
					// console.log('stop video player')
					window.SquyncEditor.videoStore.videoPosition = this.refs.videoPlayer.currentTime
					this.refs.videoPlayer.pause()
				}
			}
		}
		window.SquyncEditor.globals.on('play-mixer', playMixerHandler.bind(this))

		const playTestHandler = (state, pos) => {
			// console.log('playTestHandler')
			if (window.SquyncEditor.videoStore.videoPresent) {
				if (state) {
					// console.log('test start video player')
					this.refs.videoPlayer.currentTime = pos
					this.refs.videoPlayer.play()
				} else {
					// console.log('test stop video player')
					this.refs.videoPlayer.pause()
				}
			}
		}
		window.SquyncEditor.globals.on('play-test', playTestHandler.bind(this))

		const newPositionHandler = data => {
			if (window.SquyncEditor.videoStore.videoPresent) {
				if (this.refs.videoPlayer.paused) {
					this._videoPos = data.pos
				}
			}
		}
		window.SquyncEditor.globals.on('new-position', newPositionHandler.bind(this))
	}

	resetVideoDom() {
		this.refs.videoBoxContainer.removeChild(this.refs.videoPlayer)
		this.refs.videoPlayer = document.createElement('video')
		this.refs.videoPlayer.setAttribute('editor-ref', 'videoPlayer')
		this.refs.videoPlayer.setAttribute('muted', 'true')
		this.refs.videoPlayer.classList.add('video-player')
		this.refs.videoBoxContainer.appendChild(this.refs.videoPlayer)
	}

	resetVideo() {}

	get duration() {
		return this.refs.videoPlayer.duration
	}
	get pos() {
		return this.refs.videoPlayer.currentTime
	}
	set pos(pos) {
		try {
			pos = parseFloat(pos)
			if (pos < 0 || pos > this.refs.videoPlayer.duration) {
				//console.log('video position out of range ', pos, this.refs.videoPlayer.duration)
				window.SquyncEditor.globals.emit('video-out-range', pos, this.refs.videoPlayer.duration)
			}
			// console.log('video can play', this.refs.videoPlayer.currentTime, pos)
			if (this.refs.videoPlayer.seekable.length > 0) {
				if (this._videoPos !== pos) {
					this._videoPos = pos
					window.SquyncEditor.videoStore.videoPosition = pos
					this.refs.videoPlayer.currentTime = this._videoPos
					this._canPlay = false
				}
			} else {
				console.log('video no seekable', this.refs.videoPlayer.seekable.length)
			}
		} catch (e) {
			throw 'Parameter pos is not a number!'
		}
	}

	init() {
		return render(
			this._domNode,
			`
    <div editor-ref="videoBoxContainer">
      <video editor-ref="videoPlayer" muted ></video>
    </div>
   `
		)
	}

	// video
	handleCanPlay() {
		this._canPlay = true
	}

	resetSize(sizes) {
		window.SquyncEditor.sizes = sizes
		this.setSize(window.SquyncEditor.sizes)
	}

	setSize(size) {
		// console.log('new sizes', size, window.SquyncEditor.videoStore.videoInfo)
		let prop = window.SquyncEditor.videoStore.videoInfo.prop
		let h = window.SquyncEditor.videoStore.videoInfo.height
		let w = window.SquyncEditor.videoStore.videoInfo.width

		if (window.SquyncEditor.videoStore.videoInfo.height > size.maxVideoHeight) {
			h = size.maxVideoHeight
			w = h * prop
			if (w > size.maxVideoWidth) {
				w = size.maxVideoWidth
				h = w / prop
			}
		} else if (window.SquyncEditor.videoStore.videoInfo.width > size.maxVideoWidth) {
			w = size.maxVideoWidth
			h = w / prop
			if (h > size.maxVideoHeight) {
				h = size.maxVideoHeight
				w = h * prop
			}
		}
		this._maxHeight = h
		this.refs.videoPlayer.style.height = h + 'px'
		this.refs.videoPlayer.style.width = w + 'px'
		// console.log('new sizes', h, w)
	}

	handleLoadedMetadata(event) {
		window.SquyncEditor.videoStore.videoInfo = {
			height: event.srcElement.videoHeight,
			width: event.srcElement.videoWidth,
			prop: event.srcElement.videoWidth / event.srcElement.videoHeight,
			duration: event.srcElement.duration
		}

		this.setSize(window.SquyncEditor.sizes)

		window.SquyncEditor.videoStore.videoPresent = true
		window.SquyncEditor.zoom.duration = event.srcElement.duration
		window.SquyncEditor.videoStore.video = this.refs.videoPlayer
		this.refs.videoBoxContainer.visible = true
		this.emit('new-video', window.SquyncEditor.videoStore.videoInfo)
		window.SquyncEditor.globals.emit('wait-overlay', { show: false, title: null, result: true, type: 'video', kind: null })
		// wait.hide()
	}
	// input file
	handleEnded() {
		window.SquyncEditor.globals.emit('play-mixer', false)
	}

	handleProjectInput(event) {
		let file = event.target.files[0]
		window.SquyncEditor.globals.emit('wait-overlay', { show: true, title: file.name, result: true, type: 'project', kind: null })
		// wait.show()
		window.SquyncEditor.videoStore.load(file).then(() => {
			this.refs.videoPlayer.src = window.SquyncEditor.videoStore.videoSrc
			let h = window.SquyncEditor.sizes.maxVideoHeight
			this.refs.videoPlayer.style.height = h + 'px'
			window.SquyncEditor.globals.emit('wait-overlay', { show: false, title: file.name, result: true, type: 'project', kind: null })
			// wait.hide()
			this.emit('new-video', window.SquyncEditor.videoStore.videoInfo)
		})
	}

	// video control
	play() {
		this.refs.videoPlayer.play()
	}
	pause() {
		this.refs.videoPlayer.pause()
	}
	// thumb manipulation
}
