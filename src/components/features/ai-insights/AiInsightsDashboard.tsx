'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ROUTES } from '@/constants/routes'
import { formatMoney } from '@/lib/currency'
import { useGetAiInsightsQuery } from '@/redux/api/usageReportApi'
import { format, subDays } from 'date-fns'
import {
  Activity,
  ArrowUpRight,
  BrainCircuit,
  Coins,
  Cpu,
  Layers,
  Mic,
  Phone,
  PieChart,
  RefreshCw,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AiInsightsClientsTable } from './AiInsightsClientsTable'
import { AiInsightsDonutChart, DonutDataItem } from './AiInsightsDonutChart'
import { AiInsightsModelsTable } from './AiInsightsModelsTable'
import { AiInsightsPhoneNumbersTable } from './AiInsightsPhoneNumbersTable'
import { AiInsightsProvidersGrid } from './AiInsightsProvidersGrid'
import { AiInsightsRecentCallsTable } from './AiInsightsRecentCallsTable'
import { AiInsightsStatCard } from './AiInsightsStatCard'
import { AiInsightsTrajectoryChart } from './AiInsightsTrajectoryChart'

const isoDate = (d: Date) => format(d, 'yyyy-MM-dd')
const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format

export const AiInsightsDashboard: React.FC = () => {
  const { t } = useTranslation()
  const today = useMemo(() => new Date(), [])

  // Default to last 30 days
  const [from, setFrom] = useState(() => isoDate(subDays(today, 30)))
  const [to, setTo] = useState(() => isoDate(today))
  const [selectedModel, setSelectedModel] = useState<string>('all')
  const [donutMode, setDonutMode] = useState<'models' | 'providers'>('models')

  const { data, isFetching, refetch } = useGetAiInsightsQuery({
    from,
    to,
    model: selectedModel === 'all' ? undefined : selectedModel,
  })

  // Date presets
  const applyPreset = (preset: 'today' | '7d' | '30d' | 'month' | 'all') => {
    const end = new Date()
    let start = new Date()
    if (preset === 'today') {
      start = end
    } else if (preset === '7d') {
      start = subDays(end, 7)
    } else if (preset === '30d') {
      start = subDays(end, 30)
    } else if (preset === 'month') {
      start = new Date(end.getFullYear(), end.getMonth(), 1)
    } else if (preset === 'all') {
      start = new Date(2024, 0, 1)
    }
    setFrom(isoDate(start))
    setTo(isoDate(end))
  }

  const summary = data?.summary
  const models = data?.models || []
  const phoneNumbers = data?.phone_numbers || []
  const providers = data?.providers || []
  const timeline = data?.timeline || []
  const clients = data?.clients || []
  const recentCalls = data?.recent_calls || []
  const availableModels = data?.filter?.available_models || []

  // Donut chart data preparation
  const modelDonutData: DonutDataItem[] = useMemo(() => {
    return models.map((m) => ({
      label: m.model_id,
      value: m.total_tokens,
      subText: `${m.provider}`,
      percentage: m.tokens_percentage,
    }))
  }, [models])

  const providerDonutData: DonutDataItem[] = useMemo(() => {
    return providers.map((p) => ({
      label: p.provider,
      value: Number(p.cost.toFixed(2)),
      subText: p.service,
      percentage: p.percentage,
    }))
  }, [providers])

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-title tracking-tight">
                {t('ai_insights_title', 'AI & Provider Analytics')}
              </h1>
              <p className="text-sm text-subtitle-color mt-0.5 font-medium">
                {t('ai_insights_desc', 'Granular telemetry across AI models (OpenAI), Voice Engines (Deepgram, Sarvam, ElevenLabs), and Telephony Carriers (Plivo, Twilio, SIP).')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href={ROUTES.COST_REPORT}>
            <Button variant="outline" size="sm" className="gap-2 font-semibold text-xs border-input-border-color bg-bg-card hover:bg-primary/5">
              <span>View Cost & Profit</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2 font-semibold text-xs border-input-border-color bg-bg-card hover:bg-primary/5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-primary' : ''}`} />
            <span>{isFetching ? 'Updating...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Control Filter Bar */}
      <Card className="p-4 rounded-radius border border-input-border-color bg-bg-card shadow-xs">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
          {/* Quick presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0">
            <span className="text-xs font-semibold text-subtitle-color uppercase tracking-wider mr-2 shrink-0">
              Preset:
            </span>
            <Button variant="outline" size="sm" onClick={() => applyPreset('today')} className="h-8 px-3 text-xs rounded-lg font-medium border-input-border-color">
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset('7d')} className="h-8 px-3 text-xs rounded-lg font-medium border-input-border-color">
              Last 7D
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset('30d')} className="h-8 px-3 text-xs rounded-lg font-medium border-input-border-color">
              Last 30D
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset('month')} className="h-8 px-3 text-xs rounded-lg font-medium border-input-border-color">
              This Month
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset('all')} className="h-8 px-3 text-xs rounded-lg font-medium border-input-border-color">
              All Time
            </Button>
          </div>

          {/* Custom Date Pickers & Model Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="space-y-1">
                <Label htmlFor="date-from" className="text-[11px] text-subtitle-color font-semibold uppercase">
                  From
                </Label>
                <Input
                  id="date-from"
                  type="date"
                  value={from}
                  max={to}
                  onChange={(e) => e.target.value && setFrom(e.target.value)}
                  className="h-9 w-36 text-xs bg-input-color border-input-border-color rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="date-to" className="text-[11px] text-subtitle-color font-semibold uppercase">
                  To
                </Label>
                <Input
                  id="date-to"
                  type="date"
                  value={to}
                  min={from}
                  onChange={(e) => e.target.value && setTo(e.target.value)}
                  className="h-9 w-36 text-xs bg-input-color border-input-border-color rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1 min-w-[170px]">
              <Label className="text-[11px] text-subtitle-color font-semibold uppercase">
                Model Filter
              </Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="h-9 text-xs bg-input-color border-input-border-color rounded-lg">
                  <SelectValue placeholder="All Models" />
                </SelectTrigger>
                <SelectContent className="bg-bg-card border-input-border-color">
                  <SelectItem value="all" className="text-xs font-semibold">
                    All Models
                  </SelectItem>
                  {availableModels.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <AiInsightsStatCard
          title="Total Platform Spend"
          value={summary ? formatMoney(summary.total_cost) : '—'}
          icon={Coins}
          iconColor="text-amber-500"
          iconBg="bg-amber-500/10"
          subValue={
            summary ? (
              <div className="flex flex-col gap-0.5 text-[11px]">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-sky-500">Carrier: {formatMoney(summary.total_telephony_cost || summary.cost_breakdown?.telephony || 0)}</span>
                  <span className="text-amber-500">AI: {formatMoney(summary.total_ai_cost || ((summary.cost_breakdown?.llm || 0) + (summary.cost_breakdown?.stt || 0) + (summary.cost_breakdown?.tts || 0)))}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-subtitle-color">
                  <span>LLM: {formatMoney(summary.cost_breakdown?.llm || 0)}</span>
                  <span>STT: {formatMoney(summary.cost_breakdown?.stt || 0)}</span>
                  <span>TTS: {formatMoney(summary.cost_breakdown?.tts || 0)}</span>
                </div>
              </div>
            ) : null
          }
        />

        <AiInsightsStatCard
          title="Total Tokens"
          value={summary ? compact(summary.total_tokens) : '—'}
          icon={Cpu}
          iconColor="text-indigo-500"
          iconBg="bg-indigo-500/10"
          subValue={
            summary ? (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-indigo-500 font-semibold">Prompt: {compact(summary.input_tokens)}</span>
                <span className="text-teal-500 font-semibold">Output: {compact(summary.output_tokens)}</span>
              </div>
            ) : null
          }
        />

        <AiInsightsStatCard
          title="Telephony & Audio"
          value={summary ? `${summary.total_telephony_minutes || 0} min` : '—'}
          icon={Mic}
          iconColor="text-sky-500"
          iconBg="bg-sky-500/10"
          subValue={
            summary ? (
              <div className="flex items-center justify-between text-[11px]">
                <span>STT: {summary.total_audio_minutes} min</span>
                <span className="font-semibold text-title">{compact(summary.total_tts_chars)} TTS ch</span>
              </div>
            ) : null
          }
        />

        <AiInsightsStatCard
          title="Top Carrier & Model"
          value={summary?.top_provider || '—'}
          icon={Sparkles}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-500/10"
          badgeText={summary?.top_phone_number ? `${summary.top_phone_number}` : undefined}
          subValue={
            summary ? (
              <div className="flex items-center justify-between text-[11px]">
                <span>LLM: <strong className="text-title">{summary.top_model}</strong></span>
                <span>{summary.total_calls} calls</span>
              </div>
            ) : null
          }
        />

        <AiInsightsStatCard
          title="Unit Economy"
          value={summary ? `${formatMoney(summary.avg_cost_per_call)} / call` : '—'}
          icon={Zap}
          iconColor="text-teal-500"
          iconBg="bg-teal-500/10"
          subValue={
            summary ? (
              <div className="flex items-center justify-between text-[11px]">
                <span>Avg Density</span>
                <span className="font-semibold text-title">~{summary.avg_tokens_per_call.toLocaleString()} tok / call</span>
              </div>
            ) : null
          }
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <AiInsightsTrajectoryChart
            timeline={timeline}
            totalCost={summary?.total_cost || 0}
            totalTokens={summary?.total_tokens || 0}
          />
        </div>

        <div className="lg:col-span-4 flex flex-col justify-between">
          <div className="flex items-center justify-end mb-2">
            <div className="flex items-center bg-input-color p-1 rounded-lg border border-input-border-color text-xs">
              <button
                type="button"
                onClick={() => setDonutMode('models')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  donutMode === 'models' ? 'bg-primary text-black shadow-xs' : 'text-subtitle-color hover:text-title'
                }`}
              >
                Model Tokens
              </button>
              <button
                type="button"
                onClick={() => setDonutMode('providers')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  donutMode === 'providers' ? 'bg-primary text-black shadow-xs' : 'text-subtitle-color hover:text-title'
                }`}
              >
                Provider Spend
              </button>
            </div>
          </div>

          {donutMode === 'models' ? (
            <AiInsightsDonutChart
              title="Token Share by Model"
              subtitle="Distribution of input & output tokens across LLMs"
              icon={PieChart}
              data={modelDonutData}
              valueFormatter={(v) => `${compact(v)} tok`}
              totalLabel="Total Tokens"
              totalFormatter={(t) => compact(t)}
            />
          ) : (
            <AiInsightsDonutChart
              title="Provider Spend Share"
              subtitle="Cost split between OpenAI, Deepgram, Sarvam & ElevenLabs"
              icon={PieChart}
              data={providerDonutData}
              valueFormatter={(v) => formatMoney(v)}
              totalLabel="Total AI Spend"
              totalFormatter={(t) => formatMoney(t)}
            />
          )}
        </div>
      </div>

      {/* Tabs Exploration Section */}
      <Card className="p-4 sm:p-6 rounded-radius border border-input-border-color bg-bg-card shadow-xs">
        <Tabs defaultValue="models" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-input-border-color pb-4">
            <div>
              <h2 className="text-lg font-bold text-title tracking-tight">
                Granular Usage Intelligence
              </h2>
              <p className="text-xs text-subtitle-color mt-0.5">
                Inspect AI consumption by model, individual client account, voice providers, or recent calls
              </p>
            </div>

            <TabsList className="bg-input-color border border-input-border-color h-10 p-1 rounded-lg">
              <TabsTrigger value="models" className="gap-2 text-xs font-semibold px-3 py-1.5">
                <Cpu className="w-3.5 h-3.5" />
                <span>Models ({models.length})</span>
              </TabsTrigger>
              <TabsTrigger value="phone_numbers" className="gap-2 text-xs font-semibold px-3 py-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>Phone Numbers ({phoneNumbers.length})</span>
              </TabsTrigger>
              <TabsTrigger value="providers" className="gap-2 text-xs font-semibold px-3 py-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Providers ({providers.length})</span>
              </TabsTrigger>
              <TabsTrigger value="clients" className="gap-2 text-xs font-semibold px-3 py-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Clients ({clients.length})</span>
              </TabsTrigger>
              <TabsTrigger value="recent" className="gap-2 text-xs font-semibold px-3 py-1.5">
                <Activity className="w-3.5 h-3.5" />
                <span>Live Call Stream</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="models" className="m-0 focus-visible:outline-none">
            <AiInsightsModelsTable models={models} isLoading={isFetching} />
          </TabsContent>

          <TabsContent value="phone_numbers" className="m-0 focus-visible:outline-none">
            <AiInsightsPhoneNumbersTable phoneNumbers={phoneNumbers} isLoading={isFetching} />
          </TabsContent>

          <TabsContent value="clients" className="m-0 focus-visible:outline-none">
            <AiInsightsClientsTable clients={clients} isLoading={isFetching} />
          </TabsContent>

          <TabsContent value="providers" className="m-0 focus-visible:outline-none">
            <AiInsightsProvidersGrid
              providers={providers}
              costBreakdown={summary?.cost_breakdown || { llm: 0, stt: 0, tts: 0, telephony: 0 }}
            />
          </TabsContent>

          <TabsContent value="recent" className="m-0 focus-visible:outline-none">
            <AiInsightsRecentCallsTable recentCalls={recentCalls} isLoading={isFetching} />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Informative Benchmark Notice */}
      <div className="p-4 rounded-radius border border-input-border-color/80 bg-subcard text-xs text-subtitle-color leading-relaxed space-y-1">
        <p className="font-semibold text-title">
          Telemetry & Economics Methodology:
        </p>
        <p>
          Token counts reflect exact input prompt context and output completion tokens measured during live AI streaming calls. Model costs are calculated using standard production rates: GPT-4o-mini at ₹14.55/1M input & ₹58.20/1M output, Deepgram at ₹0.42/min STT & ₹1.46/1k chars TTS, Sarvam AI at ₹0.50/min STT & ₹3.00/1k chars TTS, and ElevenLabs at ₹3.88/1k chars TTS. Telephony carrier usage (Plivo, Twilio, SIP) is billed by exact call duration (Plivo 30s increments, Twilio 60s increments) across all provisioned phone numbers and BYO provider trunks.
        </p>
      </div>
    </div>
  )
}

export default AiInsightsDashboard
