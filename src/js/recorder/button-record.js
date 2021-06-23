'use strict'
import EventEmitter from '../utils/eventEmitter.js'
export default class ButtonRecord extends EventEmitter {
    constructor(domNode, icon, icon2, css = null) {
        super()
        this._selected = false
        this._btn = document.createElement('div')
        this._btn.classList.add('record-btn')
        this._btn.classList.add('show')
        domNode.appendChild(this._btn)
        this._btn.innerHTML = `<i class="material-icons icon1">${icon}</i><i class="material-icons icon2">${icon2}</i>`
        if (css) {
            this._btn.classList.add(css)
        }
        let self = this
        this._btn.addEventListener('click', e => {
            e.preventDefault()
            e.stopPropagation()
            if (!this._btn.classList.contains('not-enabled')) {
                self._selected = !self._selected
                if (self._selected) {
                    self._btn.classList.add('selected')
                } else {
                    self._btn.classList.remove('selected')
                }
                this.emit('change', self._selected, e.shiftKey, e.altKey)
            }
        })
    }

    visible(mode) {
        if (mode) {
            this._btn.classList.add('show')
        } else {
            this._btn.classList.remove('show')
        }
    }
    get selected() {
        return this._selected
    }

    set disabled(disabled) {
        if (disabled) {
            this._btn.classList.add('not-enabled')
        } else {
            this._btn.classList.remove('not-enabled')
        }
    }
    get disabled() {
        return this._btn.classList.contains('not-enabled')
    }

    setState(selected) {
        // console.log('selected', selected)
        this._selected = selected
        if (this._selected) {
            this._btn.classList.add('selected')
        } else {
            this._btn.classList.remove('selected')
        }
    }

    set selected(selected) {
        this._selected = selected
        if (this._selected) {
            this._btn.classList.add('selected')
        } else {
            this._btn.classList.remove('selected')
        }
    }
}