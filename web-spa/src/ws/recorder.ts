/**
 * 浏览器麦克风 PCM16 录制器。
 * 输出 16kHz / 16bit / 单声道 的 Int16Array 切片，用于 WS 上行。
 */

const TARGET_SAMPLE_RATE = 16000

export type AudioChunkHandler = (pcm16: Int16Array) => void

export class Pcm16Recorder {
  private ctx: AudioContext | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private processor: ScriptProcessorNode | null = null
  private stream: MediaStream | null = null
  private onChunk: AudioChunkHandler
  private ratio = 1
  private inputIndex = 0

  constructor(onChunk: AudioChunkHandler) {
    this.onChunk = onChunk
  }

  async start(): Promise<void> {
    if (this.stream) return

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: { ideal: TARGET_SAMPLE_RATE },
      },
    })

    this.ctx = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE })
    // 若浏览器未按 16kHz 打开，用 ratio 重采样
    this.ratio = TARGET_SAMPLE_RATE / this.ctx.sampleRate

    this.source = this.ctx.createMediaStreamSource(this.stream)
    this.processor = this.ctx.createScriptProcessor(4096, 1, 1)

    this.processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0)
      const pcm16 = this._resampleAndConvert(input)
      if (pcm16.length > 0) this.onChunk(pcm16)
    }

    this.source.connect(this.processor)
    this.processor.connect(this.ctx.destination)
  }

  stop(): void {
    if (this.source && this.processor) {
      this.source.disconnect()
      this.processor.disconnect()
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      void this.ctx.close()
    }
    this.stream?.getTracks().forEach((t) => t.stop())
    this.source = null
    this.processor = null
    this.ctx = null
    this.stream = null
    this.inputIndex = 0
  }

  private _resampleAndConvert(input: Float32Array): Int16Array {
    if (this.ratio === 1) {
      return this._floatToPcm16(input)
    }

    const outLen = Math.floor((this.inputIndex + input.length) * this.ratio) - Math.floor(this.inputIndex * this.ratio)
    const output = new Int16Array(outLen)
    let outPos = 0

    for (let i = 0; i < input.length; i++) {
      const globalIn = this.inputIndex + i
      const nextGlobalOut = (globalIn + 1) * this.ratio
      while (outPos < output.length && outPos < Math.floor(nextGlobalOut) - Math.floor(this.inputIndex * this.ratio)) {
        const srcIdx = outPos / this.ratio - this.inputIndex
        const idx0 = Math.floor(srcIdx)
        const idx1 = Math.min(idx0 + 1, input.length - 1)
        const frac = srcIdx - idx0
        const sample = input[idx0] * (1 - frac) + input[idx1] * frac
        output[outPos] = this._clamp(sample)
        outPos++
      }
    }

    this.inputIndex += input.length
    return output
  }

  private _floatToPcm16(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length)
    for (let i = 0; i < input.length; i++) {
      output[i] = this._clamp(input[i])
    }
    return output
  }

  private _clamp(sample: number): number {
    const s = Math.max(-1, Math.min(1, sample))
    return s < 0 ? s * 0x8000 : s * 0x7fff
  }
}
