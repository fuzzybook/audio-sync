'use strict'
import EventEmitter from './eventEmitter'
export default class Size extends EventEmitter {
	constructor() {
		super()
		let self = this
		this._h = 0
		this._w = 0
		this._sizes = {
			editor: null,
			editorFrame: null
		}
		this._maxVideoSizes = { height: 0, width: 0 }
		window.addEventListener('resize', () => {
			this.getBounds()
			self.emit('resized', self._sizes)
			// console.log('resized', self._sizes)
		})
	}
	set maxVideoSizes(sizes) {
		this._maxVideoSizes = sizes
	}
	get maxVideoSizes() {
		return this._maxVideoSizes
	}
	get maxVideoHeight() {
		return this._maxVideoSizes.height
	}
	get maxVideoWidth() {
		return this._maxVideoSizes.width
	}
	get editorFrameWidth() {
		if (this._sizes.editorFrame) return this._sizes.editorFrame.width
		else return 0
	}
	reBuild() {
		this.getBounds()
	}
	test(target) {
		if (this._h !== target.innerHeight || this._w !== target.innerWidth) {
			this._h = target.innerHeight
			this._w = target.innerWidth
			this.getBounds()
			return true
		}
		return false
	}
	getBounds() {
		this._sizes.editor = window.SquyncEditor.config.editor.getBoundingClientRect()
		this._sizes.editorFrame = window.SquyncEditor.config.editorFrame.getBoundingClientRect()
	}
}
