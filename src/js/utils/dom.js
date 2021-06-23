'use strict'

export const render = (node, html) => {
  node.innerHTML = html
  let refs = node.querySelectorAll(`[editor-ref]`)
  let elements = {}
  refs.forEach(currentValue => {
    let name = currentValue.getAttribute('editor-ref')
    currentValue.classList.add(camel2Dash(name))
    Object.defineProperties(currentValue, {
      'selected': {
        get() {
          return this.classList.contains('selected')
        },
        set(selected) {
          if (selected) {
            this.classList.add('selected')
          } else {
            this.classList.remove('selected')
          }

        },
        configurable: false
      },
      'visible': {
        get() {
          return this.classList.contains('show')
        },
        set(visible) {
          if (visible) {
            this.classList.add('show')
          } else {
            this.classList.remove('show')
          }
        },
        configurable: false
      }
    })
    elements[name] = currentValue
  })
  return elements
}

export const append = (node, html) => {
  let root = document.createElement('div')
  root.innerHTML = html
  let refs = root.querySelectorAll(`[editor-ref]`)
  let elements = {
    root: root
  }
  refs.forEach(currentValue => {
    let name = currentValue.getAttribute('editor-ref')
    currentValue.classList.add(camel2Dash(name))
    Object.defineProperties(currentValue, {
      'selected': {
        get() {
          return this.classList.contains('selected')
        },
        set(selected) {
          if (selected) {
            this.classList.add('selected')
          } else {
            this.classList.remove('selected')
          }

        },
        configurable: false
      },
      'visible': {
        get() {
          return this.classList.contains('show')
        },
        set(visible) {
          if (visible) {
            this.classList.add('show')
          } else {
            this.classList.remove('show')
          }
        },
        configurable: false
      }
    })
    elements[name] = currentValue
  }
  )
  node.appendChild(root)
  return elements
}

export const removeAllChildren = node => {
  if (isHTMLElement(node)) {
    while (node.firstChild) {
      if (typeof node.destroy === 'function') {
        node.destroy()
      }
      node.removeChild(node.firstChild)
    }
  }
}

export const isHTMLElement = obj => {
  try {
    //Using W3 DOM2 (works for FF, Opera and Chrome)
    return obj instanceof HTMLElement
  }
  catch (e) {
    console.log('obsolete browser', e)
    return (typeof obj === 'object') &&
      (obj.nodeType === 1) && (typeof obj.style === 'object') &&
      (typeof obj.ownerDocument === 'object')
  }
}

const camel2Dash = (v) => {
  let ret = '', prevLowercase = false
  for (let s of v) {
    const isUppercase = s.toUpperCase() === s
    if (isUppercase && prevLowercase) {
      ret += '-'
    }
    ret += s
    prevLowercase = !isUppercase
  }
  return ret.replace(/-+/g, '-').toLowerCase()
}