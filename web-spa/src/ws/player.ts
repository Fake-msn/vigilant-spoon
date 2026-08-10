/**
 * 浏览器 PCM16 流式播放器。
 * 将服务端下发的 base64 PCM16 音频块解码为 Float32，按指定采样率播放。
 * 采样率由服务端下发（DashScope realtime 输出通常为 24kHz）。
 */

export class Pcm16Player {
  private ctx: AudioContext | null = null
  private processor: ScriptProcessorNode | null = null
  private buffer: Float32Array
  private writePtr = 0
  private readPtr = 0
  private sampleRate: number

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate
    this.buffer = new Float32Array(sampleRate * 8) // 8 秒滑窗
  }

  get context(): AudioContext | null {
    return this.ctx
  }

  async start(): Promise<void> {
    if (this.ctx) return
    this.ctx = new AudioContext({ sampleRate: this.sampleRate })
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }
    this.processor = this.ctx.createScriptProcessor(4096, 0, 1)
    this.processor.onaudioprocess = (e) => {
      const out = e.outputBuffer.getChannelData(0)
      this._fill(out)
    }
    this.processor.connect(this.ctx.destination)
  }

  /** 追加一段 base64 PCM16 音频。 */
  push(base64: string): void {
    if (!base64) return
    const bytes = this._base64ToBytes(base64)
    if (bytes.length < 2) return
    const frames = Math.floor(bytes.length / 2)
    for (let i = 0; i < frames; i++) {
      const sample = bytes[i * 2] | (bytes[i * 2 + 1] << 8)
      const s16 = sample < 0x8000 ? sample : sample - 0x10000
      this._write(s16 / 0x8000)
    }
  }

  stop(): void {
    if (this.processor && this.ctx) {
      this.processor.disconnect()
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      void this.ctx.close()
    }
    this.processor = null
    this.ctx = null
    this.readPtr = 0
    this.writePtr = 0
  }

  private _fill(out: Float32Array): void {
    for (let i = 0; i < out.length; i++) {
      if (this.readPtr === this.writePtr) {
        out.fill(0, i)
        return
      }
      out[i] = this.buffer[this.readPtr]
      this.readPtr = (this.readPtr + 1) % this.buffer.length
    }
  }

  private _write(sample: number): void {
    this.buffer[this.writePtr] = sample
    this.writePtr = (this.writePtr + 1) % this.buffer.length
    // 覆盖过早的清空读指针，避免停顿
    if (this.writePtr === this.readPtr) {
      this.readPtr = (this.readPtr + 1) % this.buffer.length
    }
  }

  private _base64ToBytes(b64: string): Uint8Array {
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }
}