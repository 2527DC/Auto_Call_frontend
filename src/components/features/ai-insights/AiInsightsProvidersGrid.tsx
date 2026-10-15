'use client'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatMoney } from '@/lib/currency'
import { AiInsightProvider } from '@/types/aiInsights'
import { AudioWaveform, BrainCircuit, Mic, Sparkles } from 'lucide-react'
import React from 'react'

interface AiInsightsProvidersGridProps {
  providers: AiInsightProvider[]
  costBreakdown: {
    llm: number
    stt: number
    tts: number
  }
}

const PROVIDER_METADATA: Record<string, { icon: any; color: string; bg: string; subtitle: string; rateNote: string }> = {
  openai: {
    icon: BrainCircuit,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    subtitle: 'LLM Intelligence & Prompt Reasoning',
    rateNote: '₹14.55 / 1M input · ₹58.20 / 1M output (gpt-4o-mini)',
  },
  deepgram: {
    icon: AudioWaveform,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
    subtitle: 'Nova-2 STT & Aura Text-to-Speech Engine',
    rateNote: '₹0.42 / min STT · ₹1.46 / 1k characters TTS',
  },
  sarvam_ai: {
    icon: Mic,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    subtitle: 'Indic Multilingual Speech & Synthesis Engine',
    rateNote: '₹0.50 / min STT · ₹3.00 / 1k characters TTS',
  },
  elevenlabs: {
    icon: Sparkles,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    subtitle: 'Ultra-realistic Conversational Neural Voices',
    rateNote: '₹3.88 / 1k characters TTS (Flash / Turbo v2.5)',
  },
}

export const AiInsightsProvidersGrid: React.FC<AiInsightsProvidersGridProps> = ({
  providers,
  costBreakdown,
}) => {
  return (
    <div className="space-y-6">
      {/* Category breakdown bar */}
      <Card className="p-5 rounded-radius border border-input-border-color bg-bg-card shadow-xs">
        <h3 className="text-sm font-bold text-title uppercase tracking-wider mb-3">
          AI Service Category Distribution
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg border border-input-border-color bg-subcard">
            <div className="flex items-center justify-between text-xs text-subtitle-color font-medium">
              <span>LLM Reasoning (OpenAI)</span>
              <span className="font-bold text-title">{formatMoney(costBreakdown.llm)}</span>
            </div>
            <div className="mt-2 text-xs text-subtitle-color">
              Prompt & response completion tokens
            </div>
          </div>

          <div className="p-3 rounded-lg border border-input-border-color bg-subcard">
            <div className="flex items-center justify-between text-xs text-subtitle-color font-medium">
              <span>Speech-to-Text (STT)</span>
              <span className="font-bold text-title">{formatMoney(costBreakdown.stt)}</span>
            </div>
            <div className="mt-2 text-xs text-subtitle-color">
              Audio transcription & caller voice recognition
            </div>
          </div>

          <div className="p-3 rounded-lg border border-input-border-color bg-subcard">
            <div className="flex items-center justify-between text-xs text-subtitle-color font-medium">
              <span>Text-to-Speech (TTS)</span>
              <span className="font-bold text-title">{formatMoney(costBreakdown.tts)}</span>
            </div>
            <div className="mt-2 text-xs text-subtitle-color">
              Voice generation & agent audio synthesis
            </div>
          </div>
        </div>
      </Card>

      {/* Provider cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((p) => {
          const key = p.provider.toLowerCase().replace(/\s+/g, '_')
          const meta = PROVIDER_METADATA[key] || {
            icon: BrainCircuit,
            color: 'text-primary',
            bg: 'bg-primary/10',
            subtitle: p.service || 'AI Provider',
            rateNote: 'Configured platform rates',
          }
          const Icon = meta.icon

          return (
            <Card
              key={p.provider}
              className="p-5 rounded-radius border border-input-border-color bg-bg-card hover:border-primary/30 transition-all duration-300 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${meta.bg} ${meta.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-title">{p.provider}</h4>
                      <p className="text-xs text-subtitle-color mt-0.5">{meta.subtitle}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs font-bold text-emerald-500 border-emerald-500/20 bg-emerald-500/10">
                    Active
                  </Badge>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 pt-4 border-t border-input-border-color/60">
                  <div>
                    <span className="text-[11px] font-semibold text-subtitle-color uppercase tracking-wider">
                      Provider Spend
                    </span>
                    <div className="text-xl font-extrabold text-title mt-0.5">
                      {formatMoney(p.cost)}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-subtitle-color uppercase tracking-wider">
                      Spend Share
                    </span>
                    <div className="text-xl font-extrabold text-amber-500 mt-0.5">
                      {p.percentage}%
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <Progress value={p.percentage} className="h-1.5" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-input-border-color/60 flex items-center justify-between text-xs text-subtitle-color">
                <span className="truncate">{meta.rateNote}</span>
                <span className="font-semibold text-title shrink-0 ml-2">
                  {p.usage_value > 0 ? `${p.usage_value.toLocaleString()} ${p.usage_label}` : 'Standby'}
                </span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
