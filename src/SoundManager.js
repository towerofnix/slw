// @flow

// Super quick sound system that uses the Web Audio API.
//
// Basic usage:
//
//   const sounds = new SoundManager()
//   sounds.loadSound('smw_coin').playNew()
//
//   const bgm = sounds.loadSound('music/chilly-tropics.mp3')
//   bgm.loops = true
//   bgm.playNew()
//
//   if (this.bgm) {
//     this.bgm.stop()
//   }
//   this.bgm = sounds.loadSound('music/airship.mp3')
//   this.bgm.playNew()
//
export default class SoundManager {
  sounds: Map<string, Sound>

  ctx: AudioContext

  urlTemplate: Function

  constructor() {
    this.sounds = new Map()

    this.ctx = new AudioContext()

    this.urlTemplate = u => {
      const ext = u.match(/\.[^.]*$/)
      if (ext) {
        return `sound/${u}`
      } else {
        return `sound/${u}.wav`
      }
    }
  }

  getSound(name: string): Sound {
    if (!this.sounds.has(name)) {
      const sound = new Sound(this, this.urlTemplate(name))
      this.sounds.set(name, sound)

      sound.load()

      return sound
    } else {
      // @flow ignore
      return this.sounds.get(name)
    }
  }
}

export class Sound {
  manager: SoundManager

  srcURL: string

  dataBuffer: AudioBuffer
  dataBufferLoaded: boolean

  loadingPromise: Promise<*>

  loops: boolean

  sources: Array<AudioBufferSourceNode>

  constructor(manager: SoundManager, srcURL: string) {
    this.manager = manager

    this.srcURL = srcURL

    this.dataBufferLoaded = false

    this.sources = []
  }

  load() {
    // If we're already downloading this sound, no need to download again!
    if (this.loadingPromise) return this.loadingPromise

    this.loadingPromise = fetch(this.srcURL)
      .then(response => response.arrayBuffer())
      .then(buf => this.manager.ctx.decodeAudioData(buf))
      .then(data => {
        this.dataBuffer = data
        this.dataBufferLoaded = true
      })

    return this.loadingPromise
  }

  playNew() {
    if (this.dataBufferLoaded) {
      const source = this.manager.ctx.createBufferSource()
      source.connect(this.manager.ctx.destination)
      source.buffer = this.dataBuffer
      source.loop = this.loops
      source.start(0)
      this.sources.push(source)
    } else {
      this.load().then(() => this.playNew())
    }
  }

  stop() {
    for (let source of this.sources) {
      source.stop()
    }

    this.sources.splice(0, this.sources.length)
  }
}
