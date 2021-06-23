
export default class TrackPosition {
  constructor(scale, left, width) {
    this._left = left
    this._leftPX = window.SquyncEditor.zoom.timeToPx(left)
    this._right = left + width
    this._rightPX = window.SquyncEditor.zoom.timeToPx(left + width)
  }
  get left() {
    return this._leftPX
  }
  set left(left) {
    this._left = window.SquyncEditor.zoom.pxToTime(left)
    this._leftPX = left
  }
  get right() {
    return this._rightPX
  }
  set right(right) {
    this._right = window.SquyncEditor.zoom.pxToTime(right)
    this._rightPX = right
  }
  get width() {
    return this._rightPX - this._leftPX
  }
  set width(width) {
    this._right = this._leftPX + window.SquyncEditor.zoom.pxToTime(width)
    this._rightPX = this._left + width
  }
  get pos() {
    return { left: this._leftPX, right: this._rightPX, width: this._rightPX - this._leftPX }
  }
  setPos(left, right) {
    this._left = window.SquyncEditor.zoom.pxToTime(left)
    this._leftPX = left
    this._right = window.SquyncEditor.zoom.pxToTime(right)
    this._rightPX = right
  }
  setScale() {
    this._leftPX = window.SquyncEditor.zoom.timeToPx(this._left)
    this._rightPX = window.SquyncEditor.zoom.timeToPx(this._right)
    return { left: this._leftPX, right: this._rightPX, width: this._rightPX - this._leftPX }
  }
}