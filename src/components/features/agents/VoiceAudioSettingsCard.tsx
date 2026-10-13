'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { GreetingMode, InterruptionSensitivity, VoiceAudioSettingsCardProps } from '@/types/agent'
import { useTranslation } from 'react-i18next'

export function VoiceAudioSettingsCard({
  responseDelay,
  setResponseDelay,
  speechSpeed,
  setSpeechSpeed,
  pitch,
  setPitch,
  greetingMode,
  setGreetingMode,
  helloWaitMs,
  setHelloWaitMs,
  allowInterruptions,
  setAllowInterruptions,
  interruptionSensitivity,
  setInterruptionSensitivity,
}: VoiceAudioSettingsCardProps) {
  const { t } = useTranslation()

  return (
    <div className="bg-bg-card p-4 sm:p-6 rounded-radius border border-input-border-color transition-all duration-300">
      <h2 className="sm:text-xl text-lg font-black flex items-center gap-2.5 mb-2">
        <span>{t("voice_audio_settings")}</span>
      </h2>
      <p className="text-sm text-muted-foreground mb-6">{t("voice_audio_settings_desc")}</p>

      <div className="space-y-6 bg-input-color sm:p-6 p-4 rounded-radius border border-input-border-color">
        {/* Greeting on pickup (outgoing calls) */}
        <div className="space-y-3">
          <Label className="text-md font-semibold text-subtitle-color">{t("greeting_on_pickup")}</Label>
          <p className="text-xs text-muted-foreground">{t("greeting_on_pickup_desc")}</p>
          <Select value={greetingMode} onValueChange={(v) => setGreetingMode(v as GreetingMode)}>
            <SelectTrigger className="h-10 rounded-radius bg-white dark:bg-zinc-900 border-input-border-color dark:border-white/10 font-bold shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl shadow-2xl border-white/10">
              <SelectItem value="wait_for_hello" className="font-bold">{t("greeting_wait_for_hello")}</SelectItem>
              <SelectItem value="immediate" className="font-bold">{t("greeting_immediate")}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t(greetingMode === 'immediate' ? "greeting_immediate_hint" : "greeting_wait_for_hello_hint")}
          </p>
        </div>

        {greetingMode === 'wait_for_hello' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-md font-semibold text-subtitle-color">{t("greet_anyway_after")}</Label>
              <span className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary/95 px-3 py-1 rounded-radius text-xs font-black">{(helloWaitMs / 1000).toFixed(1)}s</span>
            </div>
            <Slider value={[helloWaitMs]} onValueChange={(v) => setHelloWaitMs(v[0])} min={300} max={3000} step={100} className="py-2" />
          </div>
        )}

        {/* Caller may talk over the agent */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label className="text-md font-semibold text-subtitle-color">{t("allow_interruptions")}</Label>
              <p className="text-xs text-muted-foreground">{t("allow_interruptions_desc")}</p>
            </div>
            <Switch
              checked={allowInterruptions}
              onCheckedChange={setAllowInterruptions}
              className="data-[state=checked]:bg-primary shadow-sm"
            />
          </div>
          {allowInterruptions && (
            <>
              <Select value={interruptionSensitivity} onValueChange={(v) => setInterruptionSensitivity(v as InterruptionSensitivity)}>
                <SelectTrigger className="h-10 rounded-radius bg-white dark:bg-zinc-900 border-input-border-color dark:border-white/10 font-bold shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-2xl border-white/10">
                  <SelectItem value="low" className="font-bold">{t("interruption_sensitivity_low")}</SelectItem>
                  <SelectItem value="medium" className="font-bold">{t("interruption_sensitivity_medium")}</SelectItem>
                  <SelectItem value="high" className="font-bold">{t("interruption_sensitivity_high")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t(`interruption_sensitivity_${interruptionSensitivity}_hint`)}</p>
            </>
          )}
        </div>

        {/* Latency Delay */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-md font-semibold text-subtitle-color">{t("latency_delay")}</Label>
            <span className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary/95 px-3 py-1 rounded-radius text-xs font-black">{responseDelay}s</span>
          </div>
          <Slider value={[responseDelay]} onValueChange={(v) => setResponseDelay(v[0])} max={5} step={0.1} className="py-2" />
        </div>

        {/* Speech Speed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-md font-semibold text-subtitle-color">{t("speech_speed")}</Label>
            <span className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary/95 px-3 py-1 rounded-radius text-xs font-black">{speechSpeed}x</span>
          </div>
          <Slider value={[speechSpeed]} onValueChange={(v) => setSpeechSpeed(v[0])} min={0.5} max={2.0} step={0.1} className="py-2" />
        </div>

        {/* Pitch */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-md font-semibold text-subtitle-color">{t("pitch")}</Label>
            <span className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary/95 px-3 py-1 rounded-radius text-xs font-black">{pitch}</span>
          </div>
          <Slider value={[pitch]} onValueChange={(v) => setPitch(v[0])} min={-10} max={10} step={1} className="py-2" />
        </div>
      </div>
    </div>
  )
}
