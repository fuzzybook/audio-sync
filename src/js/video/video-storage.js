'use strict'
import EventEmitter from '../utils/eventEmitter'

class Scenes {
	constructor() {
		this._items = []
		this._ids = 0
	}
	get items() {
		return this._items
	}
	set items(items) {
		this._items = items
		window.SquyncEditor.globals.emit('change-scenes', this._items)
	}
	get length() {
		return this._items.length
	}

	compareScene(a, b) {
		a = parseFloat(a.pos)
		b = parseFloat(b.pos)
		if (a < b) return -1
		if (a > b) return 1
		return 0
	}
	addScene(scene) {
		scene.id = this._ids++
		this._items.push(scene)
		this._items = this._items.sort(this.compareScene)
		window.SquyncEditor.globals.emit('change-scenes', this._items)
	}
	findScene(id) {
		for (let i = 0; i !== this._items.length; i++) {
			if (this._items.id === id) {
				return this._items[i]
			}
		}
		return null
	}
	removeScene(id) {
		for (let i = 0; i !== this._items.length; i++) {
			if (this._items[i].id === id) {
				this._items.splice(i, 1)
				this._items = this._items.sort(this.compareScene)
				window.SquyncEditor.globals.emit('change-scenes', this._items)
				return true
			}
		}
		return false
	}
	toJson() {
		let j = []
		for (let i = 0; i !== this._items.length; i++) {
			j.push({
				id: this._items.id,
				title: this._items.title,
				description: this._items.description,
				img: this._items.img
			})
		}
		return j
	}
}

export default class VideoStorage extends EventEmitter {
	constructor() {
		super()
		this._video = null
		this._videoPresent = false
		this._videoPosition = 0
		this._videoInfo = {
			height: 0,
			width: 0,
			duration: 0,
			prop: 1.71
		}
		this._videoName = ''
		this._videoLocal = false
		this._videoFile = null
		this._videoSrc = null
		this._audioBuffer = null
		this._scenes = new Scenes()
		this._productionBuffer = null

		const removeSceneHandler = item => {
			this.removeScene(item.id)
		}
		window.SquyncEditor.globals.on('remove-scene', removeSceneHandler.bind(this))
	}

	clear() {
		this._videoPresent = false
		this._videoInfo = {
			height: 0,
			width: 0,
			duration: 0,
			prop: 1.71
		}
		this._videoSrc = null
		this._scenes = new Scenes()
	}

	handleVideoInput(file, name, skipOverlay) {
		return new Promise((resolve, reject) => {
			try {
				let self = this
				if (!skipOverlay) window.SquyncEditor.globals.emit('wait-overlay', { show: true, title: name, result: true, type: 'video', kind: null, kind: null })
				// wait.show()
				let videoPlayer = window.SquyncEditor.config.getNode(document, 'videoPlayer')
				videoPlayer.addEventListener('error', err => {
					alert(err)
				})
				self.clear()
				self.videoFile = file
				videoPlayer.style.height = '100px'
				videoPlayer.style.width = '100px'
				window.SquyncEditor.sizes.reBuild()
				let url = window.URL || window.webkitURL
				videoPlayer.src = url.createObjectURL(file)

				resolve()
			} catch (e) {
				// console.log(e)
				window.SquyncEditor.globals.emit('wait-overlay', { show: false, title: name, result: false, type: 'video', kind: null })
				//wait.hide()
				reject()
			}
		})
	}

	load(file) {
		return new Promise((resolve, reject) => {
			var reader = new FileReader()
			let self = this
			reader.addEventListener('abort', () => {
				reject()
			})
			reader.addEventListener('error', () => {
				reject()
			})
			// reader.addEventListener('progress', e => {
			//   console.log('progress', e)
			// })
			reader.addEventListener('load', () => {
				let project = JSON.parse(reader.result)
				// console.log(project)
				self._videoSrc = project.videoData
				self._videoInfo = project.info
				self._scenes.items = project.videoScenes
				resolve()
			})
			reader.readAsText(file)
		})
	}
	get audioBuffer() {
		return this._audioBuffer
	}
	get duration() {
		if (!this._videoPresent) return false
		return this._videoInfo.duration
	}
	get video() {
		return this._video
	}
	set video(video) {
		this._video = video
	}
	get videoFile() {
		return this._videoFile
	}
	set videoFile(file) {
		this._videoFile = file
	}
	get videoLocal() {
		return this._videoLocal
	}
	set videoLocal(local) {
		this._videoLocal = local
	}
	get videoPresent() {
		return this._videoPresent
	}
	set videoPresent(present) {
		this._videoPresent = present
		this.emit('video-present', present)
	}
	get videoPosition() {
		return this._videoPosition
	}
	set videoPosition(pos) {
		this._videoPosition = pos
	}
	get videoUrl() {
		return URL.createObjectURL(this._videoSrc)
	}
	get videoSrc() {
		return this._videoSrc
	}
	set videoSrc(src) {
		this._videoSrc = src
	}
	get videoName() {
		return this._videoName
	}
	set videoName(name) {
		this._videoName = name
	}
	get videoInfo() {
		return this._videoInfo
	}
	set videoInfo(info) {
		// console.log(info)
		this._videoInfo = info
		this.emit('video-info', info)
	}
	get scenes() {
		return this._scenes.items
	}
	set scenes(items) {
		// console.log('set scenes')
		items.map(item => {
			this.addScene(item)
		})
		this._scenes.items = items
	}

	get productionBuffer() {
		return this._productionBuffer
	}
	set productionBuffer(buffer) {
		this._productionBuffer = buffer
		this.emit('production-buffer', buffer)
	}

	getScene(id) {
		return this._scenes.getScene(id)
	}
	addScene(scene) {
		let result = this._scenes.addScene(scene)
		if (result) {
			this.emit('video-new-scene', scene)
		}
		return result
	}
	removeScene(id) {
		let result = this._scenes.removeScene(id)
		if (result) {
			this.emit('video-removed-scene', id)
		}
		return result
	}
	findScene(id) {
		return this._scenes.findScene(id)
	}
	snapImage() {
		if (this.videoPresent) {
			var canvas = document.createElement('canvas')
			canvas.height = 80
			canvas.width = 80 * (this._videoInfo.width / this._videoInfo.height)
			canvas.getContext('2d').drawImage(this._video, 0, 0, canvas.width, canvas.height)
			var image = canvas.toDataURL()
			//console.log(image)
			var success = image.length > 10000
			if (success) {
				return image
			}
		}
		return null
	}
}
