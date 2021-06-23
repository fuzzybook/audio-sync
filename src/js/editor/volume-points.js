export default class VolumePoints {
  constructor() {
    this._points = []
  }
  addPoint(pos, volume) {
    this._points.push({
      p: pos,
      v: volume
    })
    // console.log(this._points)
  }
  changePoint(index, pos) {
    let newPoint
    if (index === 0 || index === this._points.length - 1) {
      this._points[index].v = pos.y
      newPoint = this._points[index]
      return newPoint
    }
    if (this._points[index]) {
      let gap = window.SquyncEditor.zoom.pxToTime(10)
      let min = this._points[index - 1].p || 0
      let max = this._points[index + 1].p || window.SquyncEditor.zoom.duration
      let x = window.SquyncEditor.zoom.pxToTime(pos.x)
      // console.log(min + gap, max - gap, gap, x)
      this._points[index].v = pos.y
      this._points[index].p = x
      if (x < min + gap) {
        this._points[index].p = min + gap
      }
      if (x > max - gap) {
        this._points[index].p = max - gap
      }
      newPoint = this._points[index]
    }
    return newPoint
  }
  findLineIndex(p) {
    for (let i = 0; i != this._points.length; i++) {
      if (this._points[i].p >= p) {
        return i
      }
    }
    return false
  }
  insertPoint(p, v) {
    let index = this.findLineIndex(p)
    if (index !== false) {
      //this._points[index].p = p
      //this._points[index].v = v
      this._points.splice(index, 0, { p: p, v: v })
    }
  }

  removePointVolume(index) {
    if (index === 0 || index === this._points.length - 1) {
      return
    }
    if (this._points[index]) {
      this._points.splice(index, 1)
    }
  }
  changePointVolume(index, volume) {
    let newPoint
    if (this._points[index]) {
      this._points[index].v = volume
      newPoint = this._points[index]
    }
    return newPoint
  }

  get points() {
    return this._points
  }

  set points(points) {
    this._points = points
  }
}
