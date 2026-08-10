import { Pcm16Recorder } from './recorder'
import { Pcm16Player } from './player'

export type VoiceEvent =
  | { type: 'session_started' }
  | { type: 'vad_start' }
  | { type: 'transcript'; from: 'me' | 'ai'; text: string }
  | { type: 'vad_end' }
  | { type: 'audio_chunk'; data: string; rate: number }
  | { type: 'image'; kind: 'cake' | 'dream' }
  | { type: 'turn_end' }
  | { type: 'session_end' }

export type VoicePhase = 'idle' | 'listening' | 'thinking' | 'speaking'

export type VoiceClientOptions = {
  token: string
  studentId: string
  mode?: 'classroom' | 'journal' | 'lesson'
  onEvent: (event: VoiceEvent) => void
  onError?: (err: Error) => void
}

// 按当前页面协议推导 WS 地址，避免在 HTTPS 下写死 ws://（浏览器会禁止 ws 明文连接）
export const wsBase = (): string =>
  `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`

function buildWsUrl(token: string, studentId: string, mode: string): string {
  const base = import.meta.env.VITE_API_BASE || '/api'
  // 去掉可能的前导 http/https，保留 path（走 vite 代理转发到后端）
  const path = base.replace(/^https?:\/\/[^/]+/, '')
  return `${wsBase()}${path}/ws/voice?token=${encodeURIComponent(token)}&student_id=${encodeURIComponent(studentId)}&mode=${encodeURIComponent(mode)}`
}

export class VoiceClient {
  private ws: WebSocket | null = null
  private recorder: Pcm16Recorder | null = null
  private player: Pcm16Player | null = null
  private options: VoiceClientOptions
  private _recording = false
  private _sessionStarted = false
  private _sentChunks = 0

  constructor(options: VoiceClientOptions) {
    this.options = options
  }

  connect(): void {
    if (this.ws) return
    const url = buildWsUrl(this.options.token, this.options.studentId, this.options.mode || 'classroom')
    console.log('[voice] connecting:', url.replace(/token=[^&]+/, 'token=***'))
    const ws = new WebSocket(url)
    ws.binaryType = 'arraybuffer'

    ws.onopen = () => {
      console.log('[voice] ws opened, waiting for session_started')
    }

    ws.onmessage = (ev) => {
      if (typeof ev.data !== 'string') return
      try {
        const payload = JSON.parse(ev.data) as unknown
        if (!payload || typeof payload !== 'object') return
        const msg = payload as { type: string }
        this._handleEvent(msg)
      } catch {
        // ignore malformed json
      }
    }

    ws.onerror = () => {
      console.error('[voice] ws error')
      this.options.onError?.(new Error('WebSocket 连接错误'))
    }

    ws.onclose = (ev) => {
      console.log('[voice] ws closed:', ev.code, ev.reason)
      this.ws = null
      this._sessionStarted = false
      this._stopRecorder()
    }

    this.ws = ws
  }

  disconnect(): void {
    this._stopRecorder()
    this._stopPlayer()
    if (this.ws) {
      const ws = this.ws
      this.ws = null
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    }
  }

  isRecording(): boolean {
    return this._recording
  }

  async startTurn(): Promise<void> {
    if (this._recording || !this.ws || this.ws.readyState !== WebSocket.OPEN) return
    if (!this._sessionStarted) {
      throw new Error('语音服务尚未就绪，请稍等片刻再试')
    }
    this._recording = true
    this._sentChunks = 0
    console.log('[voice] startTurn: beginning recording')

    this.recorder = new Pcm16Recorder((pcm16) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(pcm16.buffer)
        this._sentChunks++
        if (this._sentChunks % 20 === 1) {
          console.log('[voice] sent audio chunk=', this._sentChunks, 'bytes=', pcm16.buffer.byteLength)
        }
      } else {
        console.warn('[voice] ws not open, cannot send audio. readyState=', this.ws?.readyState)
      }
    })
    await this.recorder.start()
    console.log('[voice] startTurn: recorder started successfully')
  }

  stopTurn(): void {
    if (!this._recording) return
    this._recording = false
    console.log('[voice] stopTurn: sent', this._sentChunks, 'chunks total')
    this._stopRecorder()
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'commit_turn' }))
    }
  }

  private _stopRecorder(): void {
    if (this.recorder) {
      this.recorder.stop()
      this.recorder = null
    }
    this._recording = false
  }

  private _stopPlayer(): void {
    if (this.player) {
      this.player.stop()
      this.player = null
    }
  }

  private _ensurePlayer(rate: number): Pcm16Player {
    if (!this.player || this.player.context?.sampleRate !== rate) {
      this._stopPlayer()
      this.player = new Pcm16Player(rate)
      void this.player.start()
    }
    return this.player
  }

  private _handleEvent(msg: { type: string }): void {
    switch (msg.type) {
      case 'session_started':
        this._sessionStarted = true
        this.options.onEvent({ type: 'session_started' })
        break
      case 'vad_start':
        this.options.onEvent({ type: 'vad_start' })
        break
      case 'vad_end':
        this.options.onEvent({ type: 'vad_end' })
        break
      case 'transcript': {
        const t = msg as unknown as { from: 'me' | 'ai'; text: string }
        this.options.onEvent({ type: 'transcript', from: t.from, text: t.text })
        break
      }
      case 'audio_chunk': {
        const a = msg as unknown as { data?: string; rate?: number }
        const data = a.data ?? ''
        const rate = a.rate ?? 24000
        if (data) {
          this._ensurePlayer(rate).push(data)
        }
        this.options.onEvent({ type: 'audio_chunk', data, rate })
        break
      }
      case 'image': {
        const img = msg as unknown as { kind: 'cake' | 'dream' }
        this.options.onEvent({ type: 'image', kind: img.kind })
        break
      }
      case 'turn_end':
        this.options.onEvent({ type: 'turn_end' })
        break
      case 'session_end':
        this.options.onEvent({ type: 'session_end' })
        break
    }
  }
}
