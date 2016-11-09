// @flow
// General utility functions.

// Gets the sign of a number, as a number. If the given number is negative,
// it returns -1, if positive, 1, and if zero, 0.
export function sign(n: number): number {
  if (n > 0) return 1
  if (n < 0) return -1
  return 0
}

// Returns a random integer from `min` through `max`.
export function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * max) + min
}

// Compares the contents of two arrays.
export function arrEqual(arr1: Array<any>, arr2: Array<any>): boolean {
  if (arr1.length !== arr2.length) {
    return false
  }

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false
    }
  }

  return true
}

// Returns an image written over by a colour, taking an operation type and alpha.
// Default values useful for masking.
export function tint(img: Image, colour: string, operation: string = 'source-in', alpha: number = 1) {
  // create hidden canvas (using image dimensions)
  let canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height

  let ctx = canvas.getContext('2d')
  if (!ctx) throw new TypeError('Failed to get new canvas context.')
  ctx.drawImage(img, 0, 0)

  // overlay filled rectangle using lighter composition
  ctx.globalCompositeOperation = operation
  ctx.globalAlpha = alpha
  ctx.fillStyle = colour
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // return a new image
  let res = new Image
  res.src = canvas.toDataURL()
  return res
}

// Event controller class.
//
// You should NOT use this:
// * When a subclass would be beter off instead. For example, don't use
//   an event controller in place of a tile subclass, even though they have
//   similar feels ("onCreate", "onDelete", etc). If you're going to have
//   one specific behavior for an event (e.g. donut tile falling when stepped
//   on for long enough), use a subclass, not an event controller.
//
// You SHOULD use this:
// * As an interface between completely separate things. Use an event
//   controller when you expect an event to be watched - for instance, a
//   level changing, or a player dying.
//
// If you're going to use an event controller, store it on the object it's
// relevant to with the events property. Then you can access it, for example,
// with game.events.
//
// Stick to normal DOM-like event names, e.g. created, beforeunload. I know
// it doesn't look very good but that's what's been used for event names for
// as long as I know (in node.js too, I think!) so that's what's going to be
// used here as well.
//
// Get tenses in names right. If the event is triggered after something
// happens, the event name should be past tense - i.e. 'created'. If the event
// is triggered before something happens, the event name should start with
// 'before' - i.e. 'beforelevelchange'.
//
// In the future there's a fair chance I'll make this work with promises, so
// that transitions might be able to be done a bit better... for example, if
// things are supposed to happen before a level is entered, such as a
// transition-out effect, they can be finished *before* the real internal
// changes happen (that is, a new level is loaded).
//
export class EventController {
  listeners: Map<string, Array<Function>>

  constructor() {
    this.listeners = new Map()
  }

  // Register an event. Adding event listeners and dispatching events will
  // throw an error if you try to do so without a registered event name -
  // this is mostly to prevent entering the wrong event name!
  registerEvent(eventName: string) {
    this.listeners.set(eventName, [])
  }

  // Add an event listener. When the given event name is dispatched, the
  // callback function will be called. The callback function may be called
  // multiple times - always once every time the event is dispatched.
  addEventListener(eventName: string, callback: Function) {
    if (this.listeners.has(eventName)) {
      const eventListeners: ?Array<Function> = this.listeners.get(eventName)
      if (eventListeners) {
        eventListeners.push(callback)
      }
    } else {
      throw new Error('Invalid event name')
    }
  }

  // Dispatch an event. That means calling every listener with that name. A
  // data object argument can be passed to give data to the functions.
  dispatchEvent(eventName: string, data: Object = {}) {
    if (this.listeners.has(eventName)) {
      const eventListeners: ?Array<Function> = this.listeners.get(eventName)
      if (eventListeners) {
        for (let callback of eventListeners) {
          callback(data)
        }
      }
    } else {
      throw new Error('Invalid event name')
    }
  }
}

const toml = require('toml')
export const levels = toml.parse(require('./levels.toml'))
