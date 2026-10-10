'use client'

import { Loader2 } from '@/components/reusable/Loader2'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useGetUsersQuery } from '@/redux/api/userApi'
import { User } from '@/types'
import { PlanClient } from '@/types/plans'
import { Plus, Search, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

// Chooses which clients can see and buy a private plan.
const PlanClientPicker = ({ value, onChange }: { value: PlanClient[]; onChange: (clients: PlanClient[]) => void }) => {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const { data: usersData, isFetching } = useGetUsersQuery({ search, limit: 5 }, { skip: !search })

  const selectedIds = new Set(value.map((c) => c._id))
  const results = (usersData?.users || []).filter((u: User) => !selectedIds.has(u.id))

  return (
    <div className="space-y-3">
      <Label className="text-md font-medium text-foreground">{t('plan_clients', 'Clients who can see this plan')}</Label>

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((client) => (
            <span key={client._id} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {client.name || client.email || client._id}
              <button
                type="button"
                onClick={() => onChange(value.filter((c) => c._id !== client._id))}
                className="rounded-full p-0.5 hover:bg-primary/20"
                aria-label={t('remove', 'Remove')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-amber-600">{t('plan_clients_empty', 'No clients yet. Nobody can see this plan until you add one.')}</p>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtitle-color" />
        <Input
          placeholder={t('search_user_by_name_or_email')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-10 rounded-radius bg-input-color border-input-border-color"
        />
      </div>

      {isFetching ? (
        <div className="flex justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        </div>
      ) : (
        search && (
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {results.map((u: User) => (
              <button
                type="button"
                key={u.id}
                onClick={() => {
                  onChange([...value, { _id: u.id, name: u.name, email: u.email }])
                  setSearch('')
                }}
                className="w-full flex items-center gap-3 p-3 rounded-radius border border-input-border-color hover:bg-primary/10 text-left transition-all"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-base line-clamp-1 break-all">{u.name}</span>
                  <span className="text-md text-subtitle-color line-clamp-1 break-all">{u.email}</span>
                </div>
                <Plus className="w-4 h-4 text-primary ml-auto shrink-0" />
              </button>
            ))}
            {results.length === 0 && <p className="text-sm text-subtitle-color px-1">{t('no_users_found', 'No users found')}</p>}
          </div>
        )
      )}
    </div>
  )
}

export default PlanClientPicker
