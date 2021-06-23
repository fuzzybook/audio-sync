'use strict'
import EventEmitter from '../utils/eventEmitter'
import VolumePoints from './volume-points'
export default class VolumeCanvas extends EventEmitter {
	constructor(domNode, id) {
		super()
		this._id = id
		this._parent = domNode
		this._volumeCanvas = document.createElement('canvas')
		this._volumeCanvas.classList.add('volume-canvas')
		this._volumeCanvas.setAttribute('height', parseInt(window.SquyncEditor.config.css.rowHeight))
		this._volumeCanvas.setAttribute('width', parseInt(window.SquyncEditor.sizes.editorFrameWidth))
		this._volumeCanvas.style.width = window.SquyncEditor.sizes.editorFrameWidth + 'px'
		domNode.appendChild(this._volumeCanvas)
		this._ctx = this._volumeCanvas.getContext('2d')
		this._lastPoint = null
		this._lastLine = null
		this._selectedIndex = -1
		this._heightOffset = 4
		this._height = parseInt(window.SquyncEditor.config.css.rowHeight) - this._heightOffset * 2
		this._width = parseInt(window.SquyncEditor.sizes.editorFrameWidth)
		this._fullScrolled = false
		this._left = 0
		this._volumePoints = new VolumePoints()
		this._mouseDown = false
		this._lineColor = '#009400'
		this._pointColor = '#009400'
		this._selectedPointColor = '#00ff00'
		this._hoverPointColor = '#ff0000'

		this._volumePoints.addPoint(0, 0.5)
		this._volumePoints.addPoint(window.SquyncEditor.zoom.duration, 0.5)

		const getRelativeMousePosition = (event, target) => {
			target = target || event.target
			var rect = target.getBoundingClientRect()

			return {
				x: event.clientX - rect.left,
				y: event.clientY - rect.top
			}
		}

		const handleMouseMove = event => {
			var pos = getRelativeMousePosition(event, this._volumeCanvas)
			if (this._lastPoint && this._mouseDown) {
				if (pos.y < this._heightOffset) {
					pos.y = this._heightOffset
				}
				if (pos.y > this._height + this._heightOffset) {
					pos.y = this._height + this._heightOffset
				}
				let newPoint = this._volumePoints.changePoint(this._lastPoint.index, {
					x: pos.x + this._left,
					y: this.pxToVolume(pos.y - this._heightOffset)
				})
				// console.log(this._volumePoints.points)
				this._lastLine = null
				if (newPoint) {
					window.SquyncEditor.globals.emit('volume-change', this._lastPoint, this._id, this.pxToVolume(pos.y - this._heightOffset))
				}
			} else {
				this._lastLine = null
				this._lastPoint = null
				var closestPoint = this.getClosestPoint(pos, 8)
				if (closestPoint) {
					this._lastPoint = closestPoint
				} else {
					let closestline = this.getClosestline(pos, 4)
					if (closestline) {
						this._lastLine = closestline
					}
				}
			}
			this.redrawPoints()
		}

		this._volumeCanvas.addEventListener('mousemove', handleMouseMove)

		const handleMouseDown = event => {
			this._mouseDown = true
			var pos = getRelativeMousePosition(event, this._volumeCanvas)
			var closestPoint = this.getClosestPoint(pos, 8)
			if (closestPoint) {
				closestPoint.value = this.pxToVolume(closestPoint.y)
				window.SquyncEditor.globals.emit('volume-selection', closestPoint, this._id)
				// console.log(event, pos)
			} else {
				this._selectedIndex = -1
			}
		}

		this._volumeCanvas.addEventListener('mousedown', handleMouseDown)

		const handleMouseLeave = () => {
			this._lastLine = null
			this._lastPoint = null
			this.redrawPoints()
		}

		this._volumeCanvas.addEventListener('mouseleave', handleMouseLeave)

		const handleMouseUp = event => {
			var pos = getRelativeMousePosition(event, this._volumeCanvas)
			if (this._lastPoint && this._mouseDown) {
				this.redrawPoints()
			}
			if (this._lastLine && this._mouseDown) {
				let closestline = this.getClosestline(pos, 4)
				if (closestline) {
					// console.log('search on line', closestline, pos)
					let p = window.SquyncEditor.zoom.pxToTime(closestline.dist.dx + this._left)
					let v = this.pxToVolume(closestline.dist.dy)
					this._volumePoints.insertPoint(p, v)
					this._lastLine = null
					this.redrawPoints()
				}
			}
			this._mouseDown = false
			this._lastPoint = null
		}

		document.addEventListener('mouseup', handleMouseUp)

		window.SquyncEditor.globals.on('volume-selection', (closestPoint, id) => {
			if (id === this._id) {
				this._selectedIndex = closestPoint.index
			} else {
				this._selectedIndex = -1
			}
			this._lastLine = null
			this.redrawPoints()
		})

		window.SquyncEditor.globals.on('fader-volume-change', (index, id, value) => {
			if (id === this._id) {
				this._lastLine = null
				this._volumePoints.changePointVolume(index, value)
				this.redrawPoints()
			}
		})

		window.SquyncEditor.globals.on('volume-delete', (index, id) => {
			if (id === this._id) {
				// console.log('delete point', index, id)
				this._volumePoints.removePointVolume(index)
				this.redrawPoints()
			}
		})

		window.SquyncEditor.sizes.on('resized', () => {
			this.resetCanvas()
		})

		window.SquyncEditor.globals.on('zoom', () => {
			this.resetCanvas()
		})

		window.SquyncEditor.globals.on('position', (position, scrollLeft, scrollWidth) => {
			if (scrollWidth - scrollLeft <= this._width) {
				this._fullScrolled = true
				this._left = scrollWidth - this._width
			} else {
				this._fullScrolled = false
			}
			this.redrawPoints()
		})

		window.SquyncEditor.sizes.getBounds()
		this.redrawPoints()
	}

	/// volume node

	get points() {
		return this._volumePoints.points
	}

	set points(points) {
		console.log('set points', points)
		this._volumePoints.points = points
	}

	resetCanvas() {
		let r = window.SquyncEditor.config.editorFrame.getBoundingClientRect()
		this._ctx.clearRect(0, 0, this._width, this._height)
		this._ctx.lineWidth = 1
		this._width = r.width
		this._volumeCanvas.setAttribute('width', this._width)
		this._volumeCanvas.style.width = this._width + 'px'
		this.redrawPoints()
	}

	volumeToPx(volume) {
		return this._height * volume
	}

	pxToVolume(volume) {
		let h = this._height
		return volume / h
	}

	checkLineIntersection(line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) {
		// if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
		var denominator,
			a,
			b,
			numerator1,
			numerator2,
			result = {
				x: null,
				y: null,
				onLine1: false,
				onLine2: false
			}
		denominator = (line2EndY - line2StartY) * (line1EndX - line1StartX) - (line2EndX - line2StartX) * (line1EndY - line1StartY)
		if (denominator == 0) {
			return result
		}
		a = line1StartY - line2StartY
		b = line1StartX - line2StartX
		numerator1 = (line2EndX - line2StartX) * a - (line2EndY - line2StartY) * b
		numerator2 = (line1EndX - line1StartX) * a - (line1EndY - line1StartY) * b
		a = numerator1 / denominator
		b = numerator2 / denominator

		// if we cast these lines infinitely in both directions, they intersect here:
		result.x = line1StartX + a * (line1EndX - line1StartX)
		result.y = line1StartY + a * (line1EndY - line1StartY)
		/*
        // it is worth noting that this should be the same as:
        x = line2StartX + (b * (line2EndX - line2StartX));
        y = line2StartX + (b * (line2EndY - line2StartY));
        */
		// if line1 is a segment and line2 is infinite, they intersect if:
		if (a > 0 && a < 1) {
			result.onLine1 = true
		}
		// if line2 is a segment and line1 is infinite, they intersect if:
		if (b > 0 && b < 1) {
			result.onLine2 = true
		}
		// if line1 and line2 are segments, they intersect if both of the above are true
		return result
	}

	getIntersectedline(pos) {
		var intersectedLine = null
		for (let l = 0; l != this._volumePoints.points.length; l++) {
			let point = this._volumePoints.points[l]
			let start = {
				x: window.SquyncEditor.zoom.timeToPx(point.p) - this._left,
				y: this._height * point.v
			}
			point = this._volumePoints.points[l + 1]
			if (point) {
				let end = {
					x: window.SquyncEditor.zoom.timeToPx(point.p) - this._left,
					y: this._height * point.v
				}
				// line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY

				let line1StartX = window.SquyncEditor.zoom.timeToPx(pos) - this._left
				let line1StartY = 0
				let line1EndX = line1StartX + 1
				let line1EndY = this._height

				let line2StartX = start.x
				let line2StartY = start.y
				let line2EndX = end.x
				let line2EndY = end.y

				// line 1 pos
				let intersect = this.checkLineIntersection(line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY)
				if (intersect.onLine1 || intersect.onLine2) {
					intersectedLine = { v: Math.abs(1 - this.pxToVolume(intersect.y)), y: intersect.y, index: l }
				}
			}
		}
		return intersectedLine
	}

	getClosestPoint(from, minDist) {
		var closestPoint
		this._volumePoints.points.map((point, index) => {
			const x = window.SquyncEditor.zoom.timeToPx(point.p) - this._left
			const y = this._height * point.v
			const dist = Math.hypot(from.x - x, from.y - y)
			if (dist < minDist) {
				closestPoint = {
					x: x,
					y: y,
					index: index
				}
				minDist = dist
			}
		})

		return closestPoint
	}

	linepointNearestMouse(line, x, y) {
		const lerp = (a, b, x) => {
			return a + x * (b - a)
		}
		var dx = line.x1 - line.x0
		var dy = line.y1 - line.y0
		var t = ((x - line.x0) * dx + (y - line.y0) * dy) / (dx * dx + dy * dy)
		var lineX = lerp(line.x0, line.x1, t)
		var lineY = lerp(line.y0, line.y1, t)
		return { x: lineX, y: lineY }
	}

	distanceLineFromPoint(start, end, point) {
		let gap = window.SquyncEditor.zoom.pxToTime(10)
		if (point.x <= start.x + gap || point.x >= end.x - gap) {
			return { d: 100, dx: 0, dy: 0 }
		}

		var linepoint = this.linepointNearestMouse({ x0: start.x, y0: start.y, x1: end.x, y1: end.y }, point.x, point.y)
		var dx = point.x - linepoint.x
		var dy = point.y - linepoint.y
		var distance = Math.abs(Math.sqrt(dx * dx + dy * dy))
		return { d: distance, dx: linepoint.x, dy: linepoint.y }
	}
	// this will extend the lines list
	getClosestline(from, minDist) {
		var closestLine = null
		for (let l = 0; l != this._volumePoints.points.length; l++) {
			let point = this._volumePoints.points[l]
			let start = {
				x: window.SquyncEditor.zoom.timeToPx(point.p) - this._left,
				y: this._height * point.v
			}
			point = this._volumePoints.points[l + 1]
			if (point) {
				let stop = {
					x: window.SquyncEditor.zoom.timeToPx(point.p) - this._left,
					y: this._height * point.v
				}
				const dist = this.distanceLineFromPoint(start, stop, from)
				if (dist.d < minDist) {
					// console.log('distance', dist)
					start.y += 4
					stop.y += 4
					closestLine = {
						start: start,
						stop: stop,
						dist: dist,
						cursor: from
					}
				}
			}
		}
		return closestLine
	}

	drawLine(line, color) {
		// console.log('dreaw line %o %o dist %o', line.start, line.stop, line.dist)
		this._ctx.beginPath()
		this._ctx.strokeStyle = color
		this._ctx.moveTo(line.start.x, line.start.y)
		this._ctx.lineTo(line.stop.x, line.stop.y)
		this._ctx.stroke()
		this._ctx.strokeStyle = this._lineColor
	}

	drawPoint(x, y, color, stroke = false) {
		this._ctx.beginPath()
		if (stroke) {
			let style = this._ctx.strokeStyle
			this._ctx.strokeStyle = '#000000'
			this._ctx.moveTo(x, y)
			this._ctx.strokeRect(x - 5, y - 5, 10, 10)
			this._ctx.strokeStyle = style
		}
		this._ctx.fillStyle = color
		this._ctx.moveTo(x, y)
		this._ctx.fillRect(x - 4, y - 4, 8, 8)
	}

	clearPoint(x, y) {
		this._ctx.moveTo(x, y)
		this._ctx.clearRect(x - 4, y - 4, 8, 8)
	}

	redrawPoints() {
		let r = window.SquyncEditor.config.editorFrame.getBoundingClientRect()
		let width = r.width
		let height = this._height
		// console.log('redrawPoints', this._volumePoints.points, r, width, height)
		if (!width) {
			return
		}
		if (!this._fullScrolled) {
			let position = window.SquyncEditor.globals.getPosition()
			this._left = position.scroll
		}
		this._volumeCanvas.style.left = this._left + 'px'
		this._ctx.strokeStyle = this._lineColor
		this._ctx.beginPath()
		this._ctx.clearRect(0, 0, width, height + this._heightOffset * 2)
		let lastX = 0 - this._left
		// draw all points
		console.log('volume points', this._volumePoints.points, this._left, width)
		this._volumePoints.points.map((p, index) => {
			lastX = window.SquyncEditor.zoom.timeToPx(p.p) - this._left
			if (index === this._selectedIndex) {
				this.drawPoint(lastX, this.volumeToPx(p.v) + this._heightOffset, this._selectedPointColor, true)
			} else {
				this.drawPoint(lastX, this.volumeToPx(p.v) + this._heightOffset, this._pointColor)
			}
		})
		// draw lines
		lastX = 0
		this._ctx.beginPath()
		this._ctx.moveTo(0, height / 2)
		this._volumePoints.points.map(p => {
			lastX = window.SquyncEditor.zoom.timeToPx(p.p) - this._left
			this._ctx.lineTo(lastX, this.volumeToPx(p.v) + this._heightOffset)
			this._ctx.moveTo(lastX, this.volumeToPx(p.v) + this._heightOffset)
		})
		this._ctx.lineTo(width, height / 2)
		this._ctx.stroke()

		if (this._lastPoint && !this._mouseDown) {
			console.log('draw last point', this._lastPoint)
			this.drawPoint(this._lastPoint.x, this._lastPoint.y + this._heightOffset, this._hoverPointColor, true)
		}

		if (this._lastLine) {
			console.log('draw last line', this._lastLine)
			this._ctx.beginPath()
			this._ctx.fillStyle = this._hoverPointColor
			this._ctx.arc(this._lastLine.dist.dx, this._lastLine.dist.dy + 4, 4, 0, Math.PI * 2)
			this._ctx.fill()
		}
	}

	volumeCanvas(show) {
		if (show) {
			this.resetCanvas()
			this._volumeCanvas.classList.add('show')
		} else {
			this._volumeCanvas.classList.remove('show')
		}
	}
}
