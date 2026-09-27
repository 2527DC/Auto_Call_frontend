'use client'

import React, { useState, useMemo } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Phone, Search, Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { PhoneNumber } from '@/types/phone-number'

interface PhoneNumberSearchSelectProps {
  value: string
  onChange: (value: string) => void
  phoneNumbers: PhoneNumber[]
  isLoading?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
}

export const PhoneNumberSearchSelect: React.FC<PhoneNumberSearchSelectProps> = ({
  value,
  onChange,
  phoneNumbers,
  isLoading = false,
  disabled = false,
  placeholder,
  className
}) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedNumber = useMemo(() => {
    return phoneNumbers.find((p) => p.phone_number === value)
  }, [phoneNumbers, value])

  const filteredNumbers = useMemo(() => {
    if (!search.trim()) return phoneNumbers

    const query = search.toLowerCase().replace(/[\s\-\(\)]/g, '')
    return phoneNumbers.filter((num) => {
      const cleanPhone = (num.phone_number || '').toLowerCase().replace(/[\s\-\(\)]/g, '')
      const cleanLabel = (num.label || '').toLowerCase()
      const cleanProvider = (num.provider || '').toLowerCase()

      return (
        cleanPhone.includes(query) ||
        cleanLabel.includes(query) ||
        cleanProvider.includes(query)
      )
    })
  }, [phoneNumbers, search])

  const handleSelect = (numValue: string) => {
    onChange(numValue)
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading || phoneNumbers.length === 0}
          className={cn(
            'w-full h-10 px-3 justify-between rounded-lg bg-input-color border-input-border-color font-normal text-sm shadow-none focus:ring-primary/20',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Phone className="w-4 h-4 text-primary shrink-0" />
            {selectedNumber ? (
              <span className="font-semibold text-title tracking-wide truncate">
                {selectedNumber.phone_number}
                <span className="ml-2 font-normal text-xs text-muted-foreground">
                  ({selectedNumber.label || selectedNumber.provider?.toUpperCase() || 'PLIVO'})
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground truncate">
                {isLoading
                  ? t('loading', { defaultValue: 'Loading numbers...' })
                  : placeholder || t('select_phone_number', { defaultValue: 'Select phone number' })}
              </span>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground opacity-50 shrink-0 ml-1" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-2 bg-bg-card border-input-border-color shadow-xl rounded-radius z-[150]"
      >
        {/* Search input */}
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search_phone_numbers', { defaultValue: 'Search by number or label...' })}
            className="h-8 pl-8 pr-7 text-xs rounded-md bg-input-color border-input-border-color focus:ring-1 focus:ring-primary shadow-none"
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-title p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* List of numbers */}
        <div className="max-h-52 overflow-y-auto space-y-1 no-scrollbar">
          {filteredNumbers.length > 0 ? (
            filteredNumbers.map((num) => {
              const isSelected = num.phone_number === value
              return (
                <div
                  key={num._id || num.id || num.phone_number}
                  onClick={() => handleSelect(num.phone_number)}
                  className={cn(
                    'flex items-center justify-between px-2.5 py-2 rounded-md text-xs cursor-pointer transition-all',
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'hover:bg-primary/5 text-title font-medium'
                  )}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-semibold text-xs tracking-wider truncate">
                      {num.phone_number}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {num.label ? `${num.label} • ` : ''}
                      {num.provider ? num.provider.toUpperCase() : 'PLIVO'}
                    </span>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-primary shrink-0 ml-2" />
                  )}
                </div>
              )
            })
          ) : (
            <div className="p-4 text-center text-xs text-muted-foreground">
              {search
                ? t('no_matching_numbers', { defaultValue: 'No phone numbers match your search' })
                : t('no_phone_numbers_found', { defaultValue: 'No phone numbers found' })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default PhoneNumberSearchSelect
