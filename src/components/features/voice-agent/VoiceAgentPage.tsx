'use client'

import { DataCardGrid } from "@/components/reusable/DataCardGrid"
import { Loader2 } from '@/components/reusable/Loader2'
import { PageHeader } from "@/components/reusable/PageHeader"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PERMISSIONS } from "@/constants/permissions"
import { useDebounce } from "@/hooks/useDebounce"
import { usePermission } from "@/hooks/usePermission"
import { useGetVoicesQuery, useSyncVoicesMutation } from "@/redux/api/voiceApi"
import { Mic, RotateCw } from 'lucide-react'
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { VoiceCard } from "./VoiceCard"

export const VoiceAgentPage = () => {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [providerFilter, setProviderFilter] = useState("all")
  const [languageFilter, setLanguageFilter] = useState("all")
  const [visibilityFilter, setVisibilityFilter] = useState("all")
  const debouncedSearch = useDebounce(search, 500)
  const { hasPermission } = usePermission()

  const canSync = hasPermission(PERMISSIONS.SYNC_VOICES)
  // Admins also see hidden voices, to choose which ones clients can pick.
  const { data: response, isLoading } = useGetVoicesQuery(canSync ? { scope: 'all' } : undefined)
  const [syncVoices, { isLoading: isSyncing }] = useSyncVoicesMutation()

  const allVoices = response?.data || []

  const handleSync = async () => {
    try {
      const res = await syncVoices().unwrap()
      if (res?.success) {
        toast.success(res.message || t("voices_synced_success"))
      } else {
        toast.error(res?.message || t("voices_synced_failed"))
      }
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || t("voices_synced_error"))
    }
  }

  // Client-side filtering as the API doesn't seem to support search params currently based on backend controller
  const filteredVoices = allVoices.filter(voice => {
    const searchLower = debouncedSearch.toLowerCase()
    const matchesSearch = (
      voice.name.toLowerCase().includes(searchLower) ||
      voice.labels.accent?.toLowerCase().includes(searchLower) ||
      voice.labels.gender?.toLowerCase().includes(searchLower) ||
      voice.labels.description?.toLowerCase().includes(searchLower)
    )

    const matchesProvider = providerFilter === "all" || voice.provider?.toLowerCase() === providerFilter.toLowerCase()
    const matchesVisibility = visibilityFilter === "all" || voice.status === visibilityFilter

    const matchesLanguage = (() => {
      if (languageFilter === "all") return true
      if (languageFilter === "kn") {
        return voice.provider === "sarvam_ai"
      }
      if (languageFilter === "hi") {
        return voice.provider === "sarvam_ai" || voice.provider === "elevenlabs"
      }
      if (languageFilter === "en") {
        return true
      }
      return true
    })()

    return matchesSearch && matchesProvider && matchesVisibility && matchesLanguage
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title={t("voice_agent")}
        showBackButton={false}
        icon={<Mic className="w-8 h-8 text-primary" />}
        endContent={
          canSync && (
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              className="rounded-lg! p-padding! h-12 font-bold transition-all duration-300 flex items-center justify-center gap-2 bg-primary text-white shadow hover:bg-primary/90"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("syncing")}</span>
                </>
              ) : (
                <>
                  <RotateCw className="w-4 h-4" />
                  <span>{t('sync_voice')}</span>
                </>
              )}
            </Button>
          )
        }
      />

      <div className="space-y-6">
        <DataCardGrid
          data={filteredVoices}
          isLoading={isLoading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={t("search_voices")}
          emptyStateTitle={t("no_voices_title", "No Voices Found")}
          emptyMessage={t("no_voices_desc", "Sync available voices from your provider for automated calls.")}
          emptyStateActionLabel={t('sync_voice')}
          onEmptyStateAction={canSync ? handleSync : undefined}
          filterContent={
            <div className="flex flex-wrap gap-3">
            {canSync && (
              <div className="w-[180px]">
                <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                  <SelectTrigger className="h-11 bg-input-color border-transparent focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all")}</SelectItem>
                    <SelectItem value="active">{t("voices_shown_to_customers")}</SelectItem>
                    <SelectItem value="inactive">{t("voices_hidden_from_customers")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="w-[180px]">
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="h-11 bg-input-color border-transparent focus:border-primary">
                  <SelectValue placeholder={t("all_providers")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all_providers", "All Providers")}</SelectItem>
                  <SelectItem value="elevenlabs">{t("elevenlabs")}</SelectItem>
                  <SelectItem value="deepgram">{t("deepgram")}</SelectItem>
                  <SelectItem value="sarvam_ai">{t("sarvam_ai")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="h-11 bg-input-color border-transparent focus:border-primary">
                  <SelectValue placeholder={t("all_languages", "All Languages")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all_languages", "All Languages")}</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi (हिंदी)</SelectItem>
                  <SelectItem value="kn">Kannada (ಕನ್ನಡ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            </div>
          }
          renderCard={(voice) => (
            <VoiceCard
              voice={voice}
              canManage={canSync}
              defaultLanguage={languageFilter !== 'all' ? languageFilter : 'en'}
            />
          )}
        />
      </div>
    </div>
  )
}
