
export default class Cursor {
  constructor() {
    this._cursor = document.createElement('div')
    this._cursor.classList.add('cursor')
    this._cursor.setAttribute('ref', 'cursor')
    // to facilitate mouse over event
    let cursorLine = document.createElement('div')
    cursorLine.classList.add('cursor-line')
    this._cursor.appendChild(cursorLine)
    // console.log('window.SquyncEditor.config.rowsContainer.clientHeight', window.SquyncEditor.config.rowsContainer.clientHeight)
    this._cursor.style.height = window.SquyncEditor.config.rowsContainer.clientHeight + 20 + 'px'
    return this._cursor
  }
}