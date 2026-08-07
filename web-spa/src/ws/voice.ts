import { Pcm16Recorder } from './recorder'

export type VoiceEvent =
  | { type: 'session_started' }
  | { type: 'vad_start' }
  | { type: 'transcript'; from: 'me' | 'ai'; text: string }
  | { type: 'vad_end' }
  | { type: 'audio_chunk' }
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

function buildWsUrl(token: string, studentId: string, mode: string): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const base = import.meta.env.VITE_API_BASE || '/api'
  // 去掉可能的前导 http/https，保留 path
  const path = base.replace(/^https?:\/\/[^/]+/, '')
  return `${proto}//${window.location.host}${path}/ws/voice?token=${encodeURIComponent(token)}&student_id=${encodeURIComponent(studentId)}&mode=${encodeURIComponent(mode)}`
}

export class VoiceClient {
  private ws: WebSocket | null = null
  private recorder: Pcm16Recorder | null = null
  private options: VoiceClientOptions
  private _recording = false

  constructor(options: VoiceClientOptions) {
    this.options = options
  }

  connect(): void {
    if (this.ws) return
    const url = buildWsUrl(this.options.token, this.options.studentId, this.options.mode || 'classroom')
    const ws = new WebSocket(url)
    ws.binaryType = 'arraybuffer'

    ws.onopen = () => {
      // 连接建立后等待服务端下发 session_started
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
      this.options.onError?.(new Error('WebSocket 连接错误'))
    }

    ws.onclose = () => {
      this.ws = null
      this._stopRecorder()
    }

    this.ws = ws
  }

  disconnect(): void {
    this._stopRecorder()
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
    this._recording = true

    this.recorder = new Pcm16Recorder((pcm16) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(pcm16.buffer)
      }
    })
    await this.recorder.start()
  }

  stopTurn(): void {
    if (!this._recording) return
    this._recording = false
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

  private _handleEvent(msg: { type: string }): void {
    switch (msg.type) {
      case 'session_started':
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
      case 'audio_chunk':
        this.options.onEvent({ type: 'audio_chunk' })
        break
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
