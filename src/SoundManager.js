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

// A sound container. It may have multiple sounds playing at once.
export class Sound {
  manager: SoundManager

  srcURL: string

  dataBuffer: AudioBuffer
  dataBufferLoaded: boolean

  loadingPromise: Promise<*>

  loops: boolean
  volume: number

  sources: Array<SoundSource>

  constructor(manager: SoundManager, srcURL: string) {
    this.manager = manager

    this.srcURL = srcURL

    this.dataBufferLoaded = false

    this.loops = false
    this.volume = 1

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
    this.makeNew().then(sound => {
      sound.start()
    })
  }

  makeNew(): Promise<SoundSource> {
    if (this.dataBufferLoaded) {
      const source = new SoundSource(this, this.dataBuffer)
      this.sources.push(source)
      return Promise.resolve(source)
    } else {
      return this.load().then(() => this.makeNew())
    }
  }

  stop() {
    for (let source of this.sources) {
      source.stop()
    }

    this.sources.splice(0, this.sources.length)
  }
}

// A single sound source. Only has one sound source, and is used for
// manipulating that one sound source. Example usage - how to double the
// volume of *one* sound's output:
//
//   const sound = sounds.getSound('click')
//   sound.makeNew().then(sound => {
//     sound.volume = 2
//     sound.start()
//   })
//
// Note if you'd like to set the volume on all sound sources created by
// default, you can just do this:
//
//   const sound = sounds.getSound('click')
//   sound.volume = 2
//   sound.playNew()
//
export class SoundSource {
  manager: SoundManager

  source: AudioBufferSourceNode
  gainNode: GainNode

  constructor(sound: Sound, buffer: AudioBuffer) {
    this.manager = sound.manager

    this.source = this.manager.ctx.createBufferSource()
    this.source.buffer = buffer
    this.source.loop = sound.loops

    this.gainNode = this.manager.ctx.createGain()

    this.source.connect(this.gainNode)
    this.gainNode.connect(this.manager.ctx.destination)

    this.volume = sound.volume
  }

  start() {
    this.source.start(0)
  }

  stop() {
    this.source.stop()
  }

  set volume(value: number) {
    this.gainNode.gain.value = value
  }

  get volume(): number {
    return this.gainNode.gain.value
  }
}
