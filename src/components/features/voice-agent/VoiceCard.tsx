'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useUpdateVoiceStatusMutation } from "@/redux/api/voiceApi"
import { VoiceCardProps } from "@/types/voice"
import { AudioWaveform, Globe, Loader2, Pause, Play, Sparkles, User } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export const VoiceCard = ({ voice, canManage = false, defaultLanguage = 'en' }: VoiceCardProps) => {
  const { t } = useTranslation()
  const [updateVoiceStatus, { isLoading: isUpdatingStatus }] = useUpdateVoiceStatusMutation()

  const toggleShown = async (shown: boolean) => {
    try {
      await updateVoiceStatus({ voice_id: voice.voice_id, status: shown ? 'active' : 'inactive' }).unwrap()
    } catch (err: any) {
      toast.error(err?.data?.message || t("failed_to_update_voice"))
    }
  }

  const isMultilingual = voice.provider === 'sarvam_ai' || voice.provider === 'elevenlabs'
  const supportedLanguages = isMultilingual
    ? [
        { code: 'en', label: 'English', short: 'EN' },
        { code: 'hi', label: 'हिंदी', short: 'HI' },
        { code: 'kn', label: 'ಕನ್ನಡ', short: 'KN' },
      ]
    : [
        { code: 'en', label: 'English', short: 'EN' },
      ]

  const initialLang = (defaultLanguage && ['en', 'hi', 'kn'].includes(defaultLanguage) && isMultilingual)
    ? defaultLanguage
    : 'en'

  const [selectedLanguage, setSelectedLanguage] = useState(initialLang)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentUrlRef = useRef<string>('')

  useEffect(() => {
    if (defaultLanguage && ['en', 'hi', 'kn'].includes(defaultLanguage) && isMultilingual) {
      setSelectedLanguage(defaultLanguage)
      if (isPlaying && currentUrlRef.current && !currentUrlRef.current.includes(`lang=${defaultLanguage}`)) {
        togglePlay(defaultLanguage)
      }
    }
  }, [defaultLanguage, isMultilingual])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const getPreviewUrl = (lang: string) => {
    return `/api/voices/${voice.voice_id}/preview?lang=${lang}`
  }

  const togglePlay = (targetLang?: string) => {
    const langToPlay = targetLang || selectedLanguage
    const url = getPreviewUrl(langToPlay)

    if (!audioRef.current || currentUrlRef.current !== url) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setIsLoadingAudio(true)
      const audio = new Audio(url)
      currentUrlRef.current = url

      audio.oncanplay = () => {
        setIsLoadingAudio(false)
      }
      audio.onended = () => {
        setIsPlaying(false)
        setIsLoadingAudio(false)
      }
      audio.onerror = (err) => {
        console.error("Audio playback error:", err)
        setIsPlaying(false)
        setIsLoadingAudio(false)
        toast.error(
          voice.provider === 'sarvam_ai'
            ? t('sarvam_key_invalid', 'Sarvam AI authentication error: The configured API key was rejected by Sarvam AI. Please check your key in Settings.')
            : t('preview_playback_failed', 'Failed to play voice preview. Please check provider settings.')
        )
      }
      audioRef.current = audio
    }

    if (isPlaying && (!targetLang || targetLang === selectedLanguage)) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      setIsLoadingAudio(true)
      const playPromise = audioRef.current.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsLoadingAudio(false)
            setIsPlaying(true)
          })
          .catch((err) => {
            console.error("Failed to play voice preview:", err)
            setIsPlaying(false)
            setIsLoadingAudio(false)
            if (err?.name !== 'AbortError') {
              toast.error(
                voice.provider === 'sarvam_ai'
                  ? t('sarvam_key_invalid', 'Sarvam AI authentication error: The configured API key was rejected by Sarvam AI. Please check your key in Settings.')
                  : t('preview_playback_failed', 'Failed to play voice preview.')
              )
            }
          })
      } else {
        setIsPlaying(true)
        setIsLoadingAudio(false)
      }
    }
  }

  const handleLanguageSelect = (langCode: string) => {
    if (selectedLanguage === langCode && isPlaying) return
    setSelectedLanguage(langCode)
    if (isPlaying) {
      togglePlay(langCode)
    }
  }

  const voiceDetails = [
    {
      key: 'gender',
      value: voice.labels.gender,
      icon: User,
    },
    {
      key: 'accent',
      value: voice.labels.accent,
      icon: Globe,
    },
    {
      key: 'age',
      value: voice.labels.age,
      icon: Sparkles,
    },
    {
      key: 'description',
      value: voice.labels.description,
      icon: AudioWaveform,
    },
  ]

  return (
    <Card className="group relative overflow-hidden bg-bg-card border border-input-border-color hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 rounded-lg h-full flex flex-col">
      {/* Dynamic Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader className="sm:p-6 p-4 pb-4 relative z-10">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-subcard border-input-border-color text-zinc-600 dark:text-zinc-300 text-[10px] uppercase tracking-wider font-semibold rounded-full px-2.5 py-0.5">
                {voice.category?.toLowerCase() === 'premade' ? 'Predefined' : voice.category?.replace(/_/g, ' ')}
              </Badge>
              <Badge variant="outline" className="bg-primary/10 border-transparent text-primary text-[10px] uppercase tracking-wider font-semibold rounded-full px-2.5 py-0.5 shadow-sm shadow-primary/10">
                {t(voice.provider)}
              </Badge>
              {voice.provider === 'sarvam_ai' && (
                <Badge variant="outline" className="bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-semibold rounded-full px-2 py-0.5">
                  EN • HI • KN +10
                </Badge>
              )}
              {voice.provider === 'elevenlabs' && (
                <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold rounded-full px-2 py-0.5">
                  EN • HI • KN (Multi)
                </Badge>
              )}
              {voice.provider === 'deepgram' && (
                <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-semibold rounded-full px-2 py-0.5">
                  EN
                </Badge>
              )}
            </div>
            <h3 className="sm:text-xl text-lg font-bold text-title group-hover:text-primary transition-colors line-clamp-2">
              {voice.name}
            </h3>

            {/* Language Selection for Voice Preview */}
            {isMultilingual && (
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {t("language", "Language")}:
                </span>
                <div className="inline-flex rounded-lg bg-subcard p-0.5 border border-input-border-color">
                  {supportedLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLanguageSelect(lang.code)
                      }}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${
                        selectedLanguage === lang.code
                          ? "bg-primary text-white shadow-xs"
                          : "text-zinc-600 dark:text-zinc-300 hover:text-primary hover:bg-primary/5"
                      }`}
                      title={`Play sample in ${lang.label}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button
            size="icon"
            onClick={() => togglePlay()}
            disabled={isLoadingAudio}
            className={`shrink-0 w-14 h-14 rounded-full transition-all duration-500 relative overflow-hidden ${isPlaying
              ? "bg-primary text-white scale-105 shadow-lg shadow-primary/30"
              : "bg-subcard text-zinc-600 dark:text-zinc-300 hover:bg-primary/10 hover:text-primary border border-input-border-color hover:border-primary/30"
              }`}
          >
            {isPlaying && (
              <span className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
            )}
            {isLoadingAudio ? (
              <Loader2 className="w-5 h-5 animate-spin relative z-10" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-current relative z-10" />
            ) : (
              <Play className="w-5 h-5 fill-current relative z-10" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="sm:p-6 p-4 pt-0 relative z-10 space-y-4 flex-1">
        <div className="flex flex-wrap gap-2">
          {voiceDetails.map(({ key, value, icon: Icon }) =>
            value && (
              <div
                key={key}
                className="flex items-center gap-1.5 rounded-full border border-input-border-color bg-subcard px-3 py-1.5 dark:border-white/5 dark:bg-white/5 backdrop-blur-sm transition-colors group-hover:border-zinc-300 dark:group-hover:border-white/10"
              >
                <Icon className="h-3.5 w-3.5 text-zinc-400 group-hover:text-primary/70 transition-colors" />
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 capitalize truncate max-w-[120px]">
                  {value}
                </span>
              </div>
            )
          )}
        </div>

        {canManage && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-input-border-color bg-subcard px-3 py-2">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              {t("show_voice_to_customers")}
            </span>
            <Switch
              checked={voice.status === 'active'}
              disabled={isUpdatingStatus}
              onCheckedChange={toggleShown}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
