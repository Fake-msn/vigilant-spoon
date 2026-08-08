import { chatScript, type ChatMsg } from '@/mocks/data'

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

export class MockVoiceClient {
  private index = 0
  private timers: ReturnType<typeof setTimeout>[] = []
  private connected = false

  constructor(private onEvent: (event: VoiceEvent) => void) {}

  connect() {
    this.connected = true
    this.emit({ type: 'session_started' })
  }

  disconnect() {
    this.connected = false
    this.clearTimers()
    this.onEvent({ type: 'session_end' })
  }

  startTurn() {
    if (!this.connected || this.index >= chatScript.length) return
    this.clearTimers()

    const batch: ChatMsg[] = []
    if (chatScript[this.index]?.from === 'me') batch.push(chatScript[this.index])
    const aiIndex = this.index + batch.length
    if (chatScript[aiIndex]?.from === 'ai') batch.push(chatScript[aiIndex])

    // listening
    this.emit({ type: 'vad_start' })

    this.timers.push(
      setTimeout(() => {
        const me = batch.find((m) => m.from === 'me')
        if (me && 'text' in me) this.emit({ type: 'transcript', from: 'me', text: me.text })
        this.emit({ type: 'vad_end' })
      }, 900),
      setTimeout(() => {
        this.emit({ type: 'audio_chunk' })
      }, 1200),
      setTimeout(() => {
        const ai = batch.find((m) => m.from === 'ai')
        if (ai) {
          this.emit({ type: 'transcript', from: 'ai', text: ai.text })
          if ('image' in ai && ai.image) this.emit({ type: 'image', kind: ai.image })
        }
        this.emit({ type: 'turn_end' })
        this.index = aiIndex + 1
      }, 2200),
    )
  }

  private emit(event: VoiceEvent) {
    if (!this.connected) return
    this.onEvent(event)
  }

  private clearTimers() {
    this.timers.forEach(clearTimeout)
    this.timers = []
  }
}
