import EventEmitter from '../utils/eventEmitter'
import ZoomBox from '../commands/zoom-box'
import RowBox from '../commands/row-box.js'
import VersionBox from '../commands/version-box.js'

export default class InfoRow extends EventEmitter {
  constructor() {
    super()
    this._domNode = window.SquyncEditor.config.commands
    this._rows = this.buildRows(this._domNode)
  }
  get commander() {
    return this._commander
  }

  buildRows() {
    let node = window.SquyncEditor.config.commands
    let rows = {}
    window.SquyncEditor.config.rows.map(row => {
      if (row.active) {
        switch (row.type) {
          case 'zoom-box':
            rows[row.id] = new ZoomBox(node, row.class)
            break
          case 'music':
            rows[row.id] = new RowBox(node, row.class, row.id)
            break
          case 'sound':
            rows[row.id] = new RowBox(node, row.class, row.id)
            break
          case 'voice':
            rows[row.id] = new RowBox(node, row.class, row.id)
            break
          case 'version':
            rows[row.id] = new VersionBox(node, row.class)
            break
        }
      }
    })
    return rows
  }


}