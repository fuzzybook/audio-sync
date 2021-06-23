'use strict'
import EventEmitter from '../utils/eventEmitter'
import Track2 from '../track/trackClass2'
import RowContainer from './row-container'
import InfoRow from './infoRow'
import Target from './target'

export default class Rows extends EventEmitter {
	constructor() {
		super()
		let self = this
		this._domNode = window.SquyncEditor.config.rowsContainer
		this._dragTarget = new Target()
		this._infoNode = document.createElement('div')
		this._infoNode.classList.add('info')
		this._infoNode.setAttribute('id', 'row-info')
		this._domNode.appendChild(this._infoNode)

		this._infoRow = new InfoRow(this._infoNode)

		this._rows = {}
		this._rowsBK = ''
		this._projectRows = {}
		window.SquyncEditor.config.rows.map(r => {
			if (!r.command && r.active) {
				this._rows[r.id] = {
					container: new RowContainer(this._domNode, r.id),
					tracks: []
				}
			}
		})

		const dragTarget = (pos, selected) => {
			let r = window.SquyncEditor.config.editorFrame.getBoundingClientRect()
			let p = pos - r.x
			if (p < 0) {
				p = 0
			}
			this._dragTarget.moveTo(p, selected)
		}
		window.SquyncEditor.globals.on('drag-target', dragTarget.bind(this))

		window.SquyncEditor.globals.on('track-moved', data => {
			// console.log('track-moved', data)
			self._rows[data.row].container.positions = self.getPlaceHolders(data.row)
		})

		window.SquyncEditor.globals.on('copy-track', (index, altKey) => {
			let originalTrack = self.getTrackByIndex(index)
			let positions = originalTrack.element.getPositions()
			// console.log('copy track', positions)
			let pos = originalTrack.element._windowRight
			let width = originalTrack.element._windowRight - originalTrack.element._windowLeft
			positions.windowLeft = originalTrack.element._windowRight
			positions.windowRight = originalTrack.element._windowRight + width
			if (altKey) {
				pos = window.SquyncEditor.zoom.timeToPx(window.SquyncEditor.globals.timelinePosition)
				let offset = positions.windowLeft - pos
				positions.windowLeft -= offset
				positions.windowRight -= offset
			}
			// console.log('copy track')
			self.addTrack(originalTrack.row, originalTrack.uuid, originalTrack.url, originalTrack.title, originalTrack.type, pos, null, originalTrack.bufferOriginal).then(
				index => {
					let track = self.getTrackByIndex(index)
					track.element.setPositions(positions)
					// console.log('track copied')
				},
				error => {
					console.log('error loadin track', error)
				}
			)
		})

		window.SquyncEditor.globals.on('drop-copy-track', data => {
			let r = self._rows[data.row].container._domNode.getBoundingClientRect()
			let pos = data.x - data.offset - r.x
			let originalTrack = self.getTrackByIndex(data.index)
			let positions = originalTrack.element.getPositions()
			let offset = positions.windowLeft - pos
			positions.windowLeft -= offset
			positions.windowRight -= offset

			if (!data.ctrlKey) {
				if (data.row === originalTrack.row) {
					console.log('will move on same row')
					let offset = positions.windowLeft - pos
					positions.windowLeft -= offset
					positions.windowRight -= offset
					originalTrack.element.setPositions(positions)
					originalTrack.element.reboundGrips()
					window.SquyncEditor.globals.emit('select-track', data.index)
					return
				} else {
					console.log('remove-track')
					window.SquyncEditor.globals.emit('remove-track', data.index)
				}
			}
			self.addTrack(data.row, originalTrack.uuid, originalTrack.url, originalTrack.title, originalTrack.type, pos, null, originalTrack.bufferOriginal).then(index => {
				let track = self.getTrackByIndex(index)
				track.element.setPositions(positions)
				window.SquyncEditor.globals.emit('select-track', data.index)
			})
		})
	}

	resetBk() {
		console.log('reset BK')
		this._rowsBk = JSON.stringify(this.reduceBk())
	}

	reduceBk() {
		let items = []
		for (let r in this._rows) {
			items.push(this._rows[r].container.volumePoints)
			for (let t in this._rows[r].tracks) {
				let track = this._rows[r].tracks[t]
				items.push({ uuid: track.uuid, positions: track.element.getPositions() })
			}
		}
		return items
	}

	hasChanged() {
		let items = this.reduceBk()
		let o = JSON.stringify(items)
		console.log('has changed', o !== this._rowsBk)
		return o !== this._rowsBk
	}

	resetRows() {
		for (let r in this._rows) {
			this._rows[r].container.clear()
			this._rows[r].tracks = []
		}
		window.SquyncEditor.globals.emit('main-player-reset')
	}

	getPlaceHolders(row) {
		let holders = []
		this._rows[row].tracks.map(t => {
			holders.push([t.element._windowLeft, t.element._windowRight])
		})
		return holders
	}

	infoText(text) {
		this._infoRow.text(text)
	}

	getBuffersLenght() {
		let len = 0
		for (let i in this._rows) {
			this._rows[i].tracks.map(t => {
				let l = t.bufferOriginal.length || 0
				len += l
			})
		}
		return len
	}
	// return last track right position
	getMaxWidth() {
		let maxRight = -1
		for (let i in this._rows) {
			this._rows[i].tracks.map(t => {
				// --console.log(t)
				if (t.element._windowRight > maxRight) {
					maxRight = t.element._windowRight
				}
			})
		}
		return parseInt(maxRight + 20)
	}

	getRowByTrackIndex(index) {
		let row = null
		for (let i in this._rows) {
			this._rows[i].tracks.map(t => {
				// --console.log(t)
				if (t.element._index === index) {
					row = i
				}
			})
			if (row) {
				break
			}
		}
		return row
	}

	getTrackByIndex(index) {
		let track
		for (let i in this._rows) {
			this._rows[i].tracks.map(t => {
				// --console.log(t)
				if (t.element._index === index) {
					track = t
				}
			})
			if (track) {
				break
			}
		}
		return track
	}

	existTrack(index) {
		let found = false
		for (let i in this._rows) {
			this._rows[i].tracks.map(t => {
				// --console.log(t)
				if (t.element._index === index) {
					found = true
				}
			})
			if (found) {
				break
			}
		}
		return found
	}

	removeTrack(index) {
		let track = this.getTrackByIndex(index)
		if (track) {
			track.element.destroy()
			this.removeTrackByIndex(index)
		}
		window.SquyncEditor.globals.selectTrack(null)
		window.SquyncEditor.globals.emit('track-info')
		window.SquyncEditor.globals.emit('track-removed', this._rows, track)
		window.SquyncEditor.globals.emit('track-removed-info', track)
	}

	removeTrackByIndex(index) {
		let removed = false
		let ix = 0
		for (let i in this._rows) {
			this._rows[i].tracks.map((t, i) => {
				// --console.log(t)
				if (t.element._index === index) {
					ix = i
					removed = true
				}
			})
			if (removed) {
				this._rows[i].tracks.splice(ix, 1)
				break
			}
		}
	}

	getData() {
		let rows = {}
		for (let row in this._rows) {
			rows[row] = { tracks: [], volume: this._rows[row].container.volumePoints }
			this._rows[row].tracks.map(t => {
				let track = {
					uuid: t.uuid,
					url: t.url,
					type: t.type,
					title: t.title,
					color: t.color,
					positions: t.element.getPositions(),
					timing: t.element.getTiming()
				}
				console.log(track)
				rows[row].tracks.push(track)
			})
			// console.log('rows[row].tracks', rows[row].tracks)
		}
		return rows
	}

	__setDataTrack(row, t, audioCtx) {
		let self = this
		let track = {
			index: -1,
			element: null,
			bufferOriginal: null,
			buffer: null,
			source: null,
			uuid: t.uuid,
			title: t.title,
			url: t.url,
			row: row,
			type: t.type,
			color: t.color
		}

		this.loadTrack(track.url, audioCtx, track.title, track.type).then(
			buffer => {
				console.log('buffer', t.url, buffer)
				track.bufferOriginal = buffer
				track.uuid = t.uuid
				let index = window.SquyncEditor.globals.getNextIndex()
				track.color = window.SquyncEditor.config.colors[index % 8]
				track.index = index
				track.element = new Track2(row, index, buffer, track.title, track.type, track.color, 0)
				track.element.setPositions(t.positions)
				self._rows[row].tracks.push(track)
				self.countTracks()
				window.SquyncEditor.globals.emit('rows-updated', self._rows)
				window.SquyncEditor.globals.emit('select-track', -1)
			},
			error => {
				console.log(error)
			}
		)
	}

	setOriginalAudioTrack(audioCtx) {
		for (let r in this._projectRows) {
			for (let t in this._projectRows[r].tracks) {
				if (this._projectRows[r].tracks[t].url === 'localBuffer') {
					if (window.SquyncEditor.videoStore.audioBuffer) {
						let track = this._projectRows[r].tracks[t]
						this.setSavedDataTrack(r, track, audioCtx, window.SquyncEditor.videoStore.audioBuffer).then(track => {
							this._rows[r].tracks.push(track)
							this.countTracks()
						})
					}
				}
			}
		}
	}

	setSavedDataTrack(row, t, audioCtx, buffer = null) {
		return new Promise(resolve => {
			let track = {
				index: -1,
				element: null,
				bufferOriginal: null,
				buffer: null,
				source: null,
				title: t.title,
				uuid: t.uuid,
				url: t.url,
				row: row,
				type: t.type,
				color: t.color
			}
			// console.log(track)
			let max = window.SquyncEditor.zoom.timeToPx(window.SquyncEditor.videoStore.duration)
			if (t.positions.windowRight > max) {
				t.positions.windowRight = max
			}
			if (buffer) {
				track.bufferOriginal = buffer
				let index = window.SquyncEditor.globals.getNextIndex()
				track.color = window.SquyncEditor.config.colors[index % 8]
				track.index = index
				track.element = new Track2(row, index, buffer, track.title, track.type, track.color, 0)
				track.element.setPositions(t.positions)
				resolve(track)
			} else {
				this.loadTrack(track.url, audioCtx, track.title, track.type).then(
					buffer => {
						track.bufferOriginal = buffer
						let index = window.SquyncEditor.globals.getNextIndex()
						track.color = window.SquyncEditor.config.colors[index % 8]
						track.index = index
						track.element = new Track2(row, index, buffer, track.title, track.type, track.color, 0)
						track.element.setPositions(t.positions)
						resolve(track)
					},
					error => {
						console.log(error)
						resolve(null)
					}
				)
			}
		})
	}

	setData(rows, audioCtx) {
		return new Promise(resolve => {
			let self = this
			let hasLocalBuffer = false
			self._projectRows = rows
			let p = []
			setTimeout(() => {
				for (let r in rows) {
					if (self._rows[r]) {
						self._rows[r].container.volumePoints = rows[r].volume
						for (let rt in self._rows[r].tracks) {
							if (self._rows[r].tracks[rt] === null) {
								console.log('null track')
							}
						}
						rows[r].tracks.map(t => {
							if (t.url === 'localBuffer') {
								hasLocalBuffer = true
							} else {
								if (t.url.indexOf('blob:') === -1) {
									p.push(self.setSavedDataTrack(r, t, audioCtx))
								}
							}
						})
					}
				}
				Promise.all(p).then(tracks => {
					tracks.map(t => {
						if (t) {
							self._rows[t.row].tracks.push(t)
						}
					})
					self.countTracks()
					if (hasLocalBuffer) {
						window.SquyncEditor.globals.emit('video-audio-extracted')
					}
					window.SquyncEditor.globals.emit('select-track', -1)
					window.SquyncEditor.globals.emit('rows-updated', self._rows)
					resolve()
				})
			}, 500)
		})
	}

	countTracks() {
		let tracks = 0
		let rows = {}
		for (let row in this._rows) {
			this._rows[row].container.tracks = this._rows[row].tracks.length
			tracks += this._rows[row].tracks.length
			rows[row] = { tracks: [] }

			this._rows[row].tracks.map(t => {
				// --console.log(t)
				if (t !== null) {
					let track = {
						uuid: t.uuid,
						url: t.url,
						type: t.type,
						positions: t.element.getPositions()
					}
					rows[row].tracks.push(track)
				}
			})
		}
		window.SquyncEditor.globals.tracks = tracks
		window.SquyncEditor.globals.emit('volume-canvas', false)
	}

	addTrack(row, uuid, url, title, type, position, audioCtx, buffer = null, original = false) {
		return new Promise((resolve, reject) => {
			let self = this
			let track = {
				index: -1,
				element: null,
				bufferOriginal: null,
				buffer: null,
				source: null,
				uuid: uuid,
				title: title,
				url: url,
				row: row,
				type: type,
				color: '#027be3'
			}
			if (buffer) {
				track.bufferOriginal = buffer
				let index = window.SquyncEditor.globals.getNextIndex()
				track.index = index
				track.color = window.SquyncEditor.config.colors[index % 8]
				track.element = new Track2(row, index, buffer, title, type, track.color, position)
				self._rows[row].tracks.push(track)
				self.countTracks()
				window.SquyncEditor.globals.emit('rows-updated', self._rows)
				resolve(index)
			} else {
				self.loadTrack(url, audioCtx, track.title, track.type, original).then(
					buffer => {
						track.bufferOriginal = buffer
						let index = window.SquyncEditor.globals.getNextIndex()
						track.index = index
						track.color = window.SquyncEditor.config.colors[index % 8]
						track.element = new Track2(row, index, buffer, title, type, track.color, position)
						self._rows[row].tracks.push(track)
						self.countTracks()
						window.SquyncEditor.globals.emit('rows-updated', self._rows)
						resolve(index)
					},
					error => {
						// --console.log('error load: ', error)
						reject(error)
					}
				)
			}
		})
	}

	loadTrack(url, audioCtx, title, type = '?', original = false) {
		window.SquyncEditor.globals.emit('wait-overlay', { show: true, title: title, result: null, type: 'track', kind: type })
		// wait.show('statics/assets/equalizer-loader.svg')
		return new Promise((resolve, reject) => {
			if (original) {
			}
			console.log(url)
			fetch(url)
				.then(response => {
					if (!response.ok) {
						throw Error(response.statusText)
					} else {
						return response.arrayBuffer()
					}
				})
				.then(function(buffer) {
					audioCtx.decodeAudioData(buffer, decodedData => {
						window.SquyncEditor.globals.emit('wait-overlay', { show: false, title: title, result: true, type: 'track', kind: type })
						// wait.hide()
						resolve(decodedData)
					})
				})
				.catch(e => {
					window.SquyncEdit
					console.log(e)
					reject(Error(`Track ${url} failed to load`))
				})
		})
	}
}
