import { useState, useRef, useEffect, useCallback } from 'react'

export type ChatContext = {
  breathRate?: number
  breathTemp?: number
  aqi?: number
  pm25?: number
  pm10?: number
  tempC?: number
  humidity?: number
  placeLabel?: string | null
  age?: number
  sex?: string
  smoker?: boolean
  familyHistory?: boolean
  aiRisk?: string
  aiScore?: number
}

type Message = {
  id: string
  role: 'user' | 'assistant' | 'error'
  text: string
  ts: number
}

const QUICK_PROMPTS = [
  'How is my air quality?',
  'Is my breath rate normal?',
  'What can I do to reduce risk?',
  'Explain my AQI reading',
]

function buildSystemPrompt(ctx: ChatContext): string {
  const lines = [
    'You are a friendly, expert AI health assistant embedded in a personal health dashboard called BreathSense.',
    'The user is monitoring their environment and biometrics in real time.',
    'Keep answers concise (2–4 sentences max unless asked to elaborate), empathetic, and non-alarmist.',
    'Always remind users this is not medical advice for clinical decisions.',
    '',
    '## Current Dashboard Context',
  ]
  if (ctx.placeLabel) lines.push(`📍 Location: ${ctx.placeLabel}`)
  if (ctx.aqi != null) lines.push(`🌫 AQI: ${ctx.aqi}`)
  if (ctx.pm25 != null) lines.push(`PM2.5: ${ctx.pm25.toFixed(1)} µg/m³`)
  if (ctx.pm10 != null) lines.push(`PM10: ${ctx.pm10.toFixed(1)} µg/m³`)
  if (ctx.tempC != null) lines.push(`🌡 Outdoor Temp: ${ctx.tempC.toFixed(1)}°C`)
  if (ctx.humidity != null) lines.push(`💧 Humidity: ${ctx.humidity}%`)
  if (ctx.breathRate != null) lines.push(`💨 Breath Rate (ESP): ${ctx.breathRate} BPM`)
  if (ctx.breathTemp != null) lines.push(`🌡 Breath Temp (ESP): ${ctx.breathTemp.toFixed(1)}°C`)
  if (ctx.age != null) lines.push(`👤 Age: ${ctx.age}`)
  if (ctx.sex) lines.push(`Sex: ${ctx.sex}`)
  if (ctx.smoker != null) lines.push(`🚬 Smoker: ${ctx.smoker ? 'Yes' : 'No'}`)
  if (ctx.familyHistory != null) lines.push(`🧬 Family history: ${ctx.familyHistory ? 'Yes' : 'No'}`)
  if (ctx.aiRisk) lines.push(`🤖 Last AI Risk Assessment: ${ctx.aiRisk} (score ${ctx.aiScore ?? '?'}/100)`)
  return lines.join('\n')
}

async function sendToGemini(
  history: Message[],
  userText: string,
  ctx: ChatContext,
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('No Gemini API key — check your .env file.')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

  const contents = [
    ...history
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      })),
    { role: 'user', parts: [{ text: userText }] },
  ]

  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 20000)

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildSystemPrompt(ctx) }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    }),
    signal: controller.signal,
  })
  clearTimeout(t)

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `HTTP ${res.status}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'No response.'
}

export function Chatbot({ context = {} }: { context?: ChatContext }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hi! I'm your AI Health Assistant. I can see your live readings — ask me anything about your air quality, breath sensor, or health risks.`,
      ts: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150)
  }, [isOpen])

  // Keyboard shortcut: Ctrl+J / Cmd+J
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
        e.preventDefault()
        setIsOpen(o => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text: trimmed, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const reply = await sendToGemini(messages, trimmed, context)
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', text: reply, ts: Date.now() },
      ])
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'error',
          text: e.name === 'AbortError' ? 'Request timed out. Try again.' : `Error: ${e.message}`,
          ts: Date.now(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [loading, messages, context])

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input) }
  }

  const unread = !isOpen && messages.length > 1

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-3 flex h-[480px] w-[360px] flex-col overflow-hidden rounded-2xl border border-white/50 bg-white/20 shadow-[0_20px_70px_-10px_rgba(99,102,241,0.3)] backdrop-blur-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/30 bg-white/25 px-4 py-3 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-[9px] font-bold text-white shadow-md">
                AI
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">Health Assistant</p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="inline-block size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {loading ? 'Thinking…' : 'Ready'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {messages.length > 1 && (
                <button
                  onClick={() => setMessages(msgs => [msgs[0]])}
                  title="Clear chat"
                  className="flex size-7 items-center justify-center rounded-full border border-white/50 bg-white/30 text-slate-400 transition hover:bg-white/60 hover:text-slate-600 text-[10px]"
                >
                  <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="flex size-7 items-center justify-center rounded-full border border-white/50 bg-white/30 text-slate-500 transition hover:bg-white/60 hover:text-slate-800"
                aria-label="Close"
              >
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin">
            {messages.map(m => (
              <div
                key={m.id}
                className={`flex gap-2 items-end ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {m.role !== 'user' && (
                  <span className="shrink-0 flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-[8px] font-bold text-white shadow">
                    AI
                  </span>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed shadow-sm ${m.role === 'user'
                      ? 'rounded-br-none bg-gradient-to-br from-indigo-500 to-sky-500 text-white'
                      : m.role === 'error'
                        ? 'rounded-bl-none border border-red-200/60 bg-red-50/70 text-red-700'
                        : 'rounded-bl-none border border-white/60 bg-white/60 text-slate-800 backdrop-blur-sm'
                    }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2 items-end">
                <span className="shrink-0 flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-[8px] font-bold text-white shadow">AI</span>
                <div className="rounded-2xl rounded-bl-none border border-white/60 bg-white/60 px-4 py-3 backdrop-blur-sm">
                  <div className="flex gap-1 items-center">
                    <span className="size-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="size-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="size-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {messages.length === 1 && !loading && (
            <div className="px-3 pb-2 flex gap-1.5 flex-wrap shrink-0">
              {QUICK_PROMPTS.map(q => (
                <button
                  key={q}
                  onClick={() => void send(q)}
                  className="rounded-full border border-indigo-200/60 bg-white/50 px-2.5 py-1 text-[10px] font-medium text-indigo-700 transition hover:bg-indigo-50/80 hover:border-indigo-300 backdrop-blur-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-white/30 bg-white/20 p-3 shrink-0 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about your health…"
                disabled={loading}
                className="flex-1 rounded-xl border border-white/60 bg-white/60 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-400/30 disabled:opacity-60 backdrop-blur-sm"
              />
              <button
                onClick={() => void send(input)}
                disabled={loading || !input.trim()}
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-md transition hover:from-indigo-400 hover:to-sky-400 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                aria-label="Send"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-[9px] text-slate-400 mt-1.5 text-center">⌘J / Ctrl+J to toggle • Not medical advice</p>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{ width: 52, height: 52 }}
        className="group relative flex items-center justify-center rounded-2xl border border-white/55 bg-white/40 shadow-[0_8px_32px_-4px_rgba(99,102,241,0.4)] backdrop-blur-xl transition-all hover:bg-white/60 hover:shadow-[0_12px_40px_-4px_rgba(99,102,241,0.5)] active:scale-95"
        aria-label="Toggle chat"
      >
        <span className="absolute inset-0 rounded-2xl ring-2 ring-indigo-400/25 animate-ping opacity-50 pointer-events-none" />
        <span className="absolute inset-0 rounded-2xl ring-1 ring-white/50 pointer-events-none" />
        {isOpen ? (
          <svg className="size-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg className="size-5 text-indigo-600 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
        {unread && (
          <span className="absolute -top-1 -right-1 flex size-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
            <span className="relative inline-flex size-3 rounded-full bg-indigo-500 border-2 border-white" />
          </span>
        )}
      </button>
    </div>
  )
}
