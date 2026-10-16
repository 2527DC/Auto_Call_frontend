'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { formatMoney } from '@/lib/currency'
import { useGetCallCostQuery } from '@/redux/api/callApi'
import { format } from 'date-fns'
import {
  AudioWaveform,
  BrainCircuit,
  Coins,
  Cpu,
  Info,
  Loader2,
  Mic,
  Phone,
  PhoneCall,
  Receipt,
  Sparkles,
  Zap,
} from 'lucide-react'
import React, { useState } from 'react'

interface CallCostDialogProps {
  callId: string
  leadName?: string
  callNumber?: string
  trigger?: React.ReactNode
}

export const CallCostDialog: React.FC<CallCostDialogProps> = ({
  callId,
  leadName,
  callNumber,
  trigger,
}) => {
  const [open, setOpen] = useState(false)

  // Fetch only on-demand when the dialog is opened (pure math on recorded telemetry, 0 external API cost)
  const { data: response, isLoading, isFetching } = useGetCallCostQuery(callId, {
    skip: !open,
  })

  const costData = response?.data
  const b = costData?.breakdown

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-amber-500 bg-amber-500/10 hover:bg-amber-500 hover:text-white transition-colors"
            title="View Call Cost Breakdown (Admin)"
          >
            <Receipt className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[620px]! gap-0! max-w-[calc(100%-1.5rem)]! sm:p-6 p-4 border border-input-border-color bg-bg-card max-h-[90vh] overflow-y-auto no-scrollbar rounded-modal-radius">
        <DialogHeader className="text-left space-y-1 pb-4 border-b border-input-border-color">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-title flex items-center gap-2">
                <span>Call Cost Breakdown</span>
                <Badge variant="outline" className="text-[10px] font-semibold text-amber-500 border-amber-500/20 bg-amber-500/10 uppercase">
                  Admin Only
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-subtitle-color mt-0.5">
                {[leadName || callNumber, 'Zero external API fees · Computed from internal call telemetry'].filter(Boolean).join(' · ')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading || isFetching ? (
          <div className="flex flex-col items-center justify-center min-h-[260px] gap-2">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <span className="text-xs text-subtitle-color font-medium">Computing provider breakdown...</span>
          </div>
        ) : costData && b ? (
          <div className="space-y-4 pt-4">
            {/* Top Overview Spend Banner */}
            <Card className="p-4 rounded-radius border border-input-border-color bg-subcard">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-subtitle-color uppercase tracking-wider">
                    Total Incurred Cost
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-title mt-0.5">
                    {formatMoney(costData.total_cost)}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-subtitle-color mt-1">
                    {costData.client?.name && costData.client.name !== 'Unknown Client' && (
                      <>
                        <span className="text-primary font-semibold">Client: {costData.client.name}</span>
                        <span>·</span>
                      </>
                    )}
                    <span>Duration: <strong>{costData.duration.formatted}</strong></span>
                    <span>·</span>
                    <span>Billed: <strong>{costData.duration.billed_minutes} min</strong></span>
                    <span>·</span>
                    <span>Credits: <strong>{costData.credits_used}</strong></span>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end justify-center border-t sm:border-t-0 sm:border-l border-input-border-color/60 pt-2 sm:pt-0 sm:pl-4">
                  <div className="text-xs text-subtitle-color font-medium">Cost Distribution:</div>
                  <div className="flex items-center gap-2 text-xs font-bold mt-1">
                    <span className="text-sky-500">Carrier: {formatMoney(b.telephony.cost)}</span>
                    <span className="text-subtitle-color">·</span>
                    <span className="text-amber-500">AI: {formatMoney(costData.total_ai_cost)}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* 4 Provider Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Telephony Carrier */}
              <div className="p-3.5 rounded-lg border border-input-border-color bg-bg-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-500">
                        <PhoneCall className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs text-title">Telephony Carrier</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-sky-500 bg-sky-500/10 border-sky-500/20 font-bold uppercase">
                      {b.telephony.provider}
                    </Badge>
                  </div>

                  <div className="mt-2.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-subtitle-color">
                      <span>Billed Duration:</span>
                      <span className="font-semibold text-title">{b.telephony.billed_minutes} min</span>
                    </div>
                    <div className="flex items-center justify-between text-subtitle-color">
                      <span>Carrier Rate:</span>
                      <span className="font-semibold text-title">{formatMoney(b.telephony.rate_per_minute)} / min</span>
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {costData.duration.billing_increment}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-input-border-color/60 flex items-center justify-between">
                  <span className="text-xs font-semibold text-subtitle-color">Carrier Cost:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sky-500 text-sm">{formatMoney(b.telephony.cost)}</span>
                    <span className="text-[10px] font-semibold text-zinc-400">({b.telephony.percent}%)</span>
                  </div>
                </div>
              </div>

              {/* LLM Intelligence */}
              <div className="p-3.5 rounded-lg border border-input-border-color bg-bg-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500">
                        <BrainCircuit className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs text-title">LLM Reasoning</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-emerald-500 bg-emerald-500/10 border-emerald-500/20 font-bold">
                      {b.llm.model}
                    </Badge>
                  </div>

                  <div className="mt-2.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-subtitle-color">
                      <span>Total Tokens:</span>
                      <span className="font-semibold text-title">{b.llm.total_tokens.toLocaleString()} tok</span>
                    </div>
                    <div className="flex items-center justify-between text-subtitle-color">
                      <span>Input / Output:</span>
                      <span className="font-semibold text-title">{b.llm.input_tokens.toLocaleString()} in · {b.llm.output_tokens.toLocaleString()} out</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">
                      ₹{b.llm.rate_input_1m}/1M in · ₹{b.llm.rate_output_1m}/1M out
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-input-border-color/60 flex items-center justify-between">
                  <span className="text-xs font-semibold text-subtitle-color">LLM Cost:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-emerald-500 text-sm">{formatMoney(b.llm.cost)}</span>
                    <span className="text-[10px] font-semibold text-zinc-400">({b.llm.percent}%)</span>
                  </div>
                </div>
              </div>

              {/* Speech-to-Text */}
              <div className="p-3.5 rounded-lg border border-input-border-color bg-bg-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-500">
                        <Mic className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs text-title">Speech-to-Text</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-indigo-500 bg-indigo-500/10 border-indigo-500/20 font-bold capitalize">
                      {b.stt.provider}
                    </Badge>
                  </div>

                  <div className="mt-2.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-subtitle-color">
                      <span>Transcribed Audio:</span>
                      <span className="font-semibold text-title">{b.stt.seconds}s</span>
                    </div>
                    <div className="flex items-center justify-between text-subtitle-color">
                      <span>STT Rate:</span>
                      <span className="font-semibold text-title">{formatMoney(b.stt.rate_per_minute)} / min</span>
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      User speech voice recognition
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-input-border-color/60 flex items-center justify-between">
                  <span className="text-xs font-semibold text-subtitle-color">STT Cost:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-indigo-500 text-sm">{formatMoney(b.stt.cost)}</span>
                    <span className="text-[10px] font-semibold text-zinc-400">({b.stt.percent}%)</span>
                  </div>
                </div>
              </div>

              {/* Text-to-Speech */}
              <div className="p-3.5 rounded-lg border border-input-border-color bg-bg-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-500">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs text-title">Text-to-Speech</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-rose-500 bg-rose-500/10 border-rose-500/20 font-bold capitalize">
                      {b.tts.provider}
                    </Badge>
                  </div>

                  <div className="mt-2.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-subtitle-color">
                      <span>Characters Spoken:</span>
                      <span className="font-semibold text-title">{b.tts.characters.toLocaleString()} chars</span>
                    </div>
                    <div className="flex items-center justify-between text-subtitle-color">
                      <span>TTS Rate:</span>
                      <span className="font-semibold text-title">{formatMoney(b.tts.rate_per_1k)} / 1k chars</span>
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      Agent voice synthesis
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-input-border-color/60 flex items-center justify-between">
                  <span className="text-xs font-semibold text-subtitle-color">TTS Cost:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-rose-500 text-sm">{formatMoney(b.tts.cost)}</span>
                    <span className="text-[10px] font-semibold text-zinc-400">({b.tts.percent}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Information Methodology Note */}
            <div className="p-3 rounded-lg border border-input-border-color/60 bg-subcard flex items-start gap-2.5 text-[11px] text-subtitle-color leading-relaxed">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                Calculated purely from the call&apos;s recorded usage and system settings rates. This inquiry runs locally on your VPS with zero external third-party API costs.
              </span>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-subtitle-color">
            Unable to load cost details for this call.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default CallCostDialog
