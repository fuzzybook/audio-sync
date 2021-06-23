'use strict'

jest.disableAutomock()
import EventEmitter from '../eventEmitter.js'

describe('EventEmitter', () => {
  it('notifies listener when told to emit an event which that listener has ' + 'registered for', () => {
    const emitter = new EventEmitter()
    const callback = jest.fn()
    emitter.on('type1', callback)
    emitter.emit('type1', 'data')
    expect(callback.mock.calls[0][0]).toBe('data')
  })

  it('notifies multiple listeners when told to emit an event which multiple listeners are registered for', () => {
    const emitter = new EventEmitter()
    const callback1 = jest.fn()
    const callback2 = jest.fn()

    emitter.on('type1', callback1)
    emitter.on('type1', callback2)

    emitter.emit('type1', 'data')

    expect(callback1.mock.calls[0][0]).toBe('data')
    expect(callback2.mock.calls[0][0]).toBe('data')
  })

  it('does not notify events of different types', () => {
    const emitter = new EventEmitter()
    const callback = jest.fn()

    emitter.on('type1', callback)

    emitter.emit('type2')

    expect(callback.mock.calls.length).toBe(0)
  })

  it('does not notify of events after all listeners are removed', () => {
    const emitter = new EventEmitter()
    const callback = jest.fn()

    emitter.on('type1', callback)
    emitter.removeAllListeners()

    emitter.emit('type1')

    expect(callback.mock.calls.length).toBe(0)
  })

  it('does not notify the listener of events after it is removed', () => {
    const emitter = new EventEmitter()
    const callback = jest.fn()

    emitter.on('type1', callback)
    emitter.removeListener('type1', callback)

    emitter.emit('type1')

    expect(callback.mock.calls.length).toBe(0)
  })

  it('does not notify the listener of events after it is removed using returned remover', () => {
    const emitter = new EventEmitter()
    const callback = jest.fn()

    const remover = emitter.on('type1', callback)
    remover()

    emitter.emit('type1')

    expect(callback.mock.calls.length).toBe(0)
  })

  it('invokes only the listeners registered at the time the event was emitted, even if more were added', () => {
    const emitter = new EventEmitter()
    const callback1 = jest.fn()
    const callback2 = jest.fn()

    callback1.mockImplementation(() => {
      emitter.on('type1', callback2)
    })

    emitter.on('type1', callback1)

    emitter.emit('type1')

    expect(callback1.mock.calls.length).toBe(1)
    expect(callback2.mock.calls.length).toBe(0)
  })

  it('does not invoke listeners registered at the time the event was emitted but later removed during the event loop', () => {
    const emitter = new EventEmitter()
    const callback1 = jest.fn()
    const callback2 = jest.fn()

    callback1.mockImplementation(() => {
      subscription()
    })

    emitter.on('type1', callback1)
    const subscription = emitter.on('type2', callback2)

    emitter.emit('type1')
    emitter.emit('type2')

    expect(callback1.mock.calls.length).toBe(1)
    expect(callback2.mock.calls.length).toBe(0)
  })

  it('does notify other handlers of events after a particular listener has been removed', () => {
    const emitter = new EventEmitter()
    const callback = jest.fn()

    const subscription = emitter.on('type1', () => {
      /* empty call */
    })
    emitter.on('type1', callback)
    subscription()

    emitter.emit('type1', 'data')

    expect(callback.mock.calls[0][0]).toBe('data')
  })

  it('provides a way to register a listener that is invoked once', () => {
    const emitter = new EventEmitter()
    const callback = jest.fn()

    emitter.once('type1', callback)

    emitter.emit('type1', 'data')
    emitter.emit('type1', 'data')

    expect(callback.mock.calls.length).toBe(1)
    expect(callback.mock.calls[0][0]).toBe('data')
  })

  it('provides a way to remove all listeners', () => {
    const emitter = new EventEmitter()
    const listener1 = () => {
      /* void */
    }
    const listener2 = () => {
      /* void */
    }
    emitter.on('type1', listener1)
    emitter.on('type1', listener2)

    emitter.removeAllListeners()

    const listeners = emitter.listeners('type1')
    expect(listeners.length).toBe(0)
  })

  it('returns an array of listeners for an event', () => {
    const emitter = new EventEmitter()
    const listener1 = () => {
      /* void */
    }
    const listener2 = () => {
      /* void */
    }
    emitter.on('type1', listener1)
    emitter.on('type1', listener2)

    const listeners = emitter.listeners('type1')
    expect(listeners.length).toBe(2)
    expect(listeners).toContain(listener1)
    expect(listeners).toContain(listener2)
  })

  it('returns an empty array when there are no listeners', () => {
    const emitter = new EventEmitter()
    expect(emitter.listeners('type1').length).toBe(0)
  })
})
