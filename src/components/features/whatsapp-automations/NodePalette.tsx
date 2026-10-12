'use client'

import { CustomTooltip } from '@/components/reusable/CustomTooltip'
import { cn } from '@/lib/utils'
import { FlowNodeType } from '@/types/whatsappAutomation'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { CATEGORIES, NODE_META } from './catalog'

export const DRAG_TYPE = 'application/x-wa-step'

// The steps you can add: drag one onto the canvas, or click to add it below the selected step.
const NodePalette = ({ onAdd, compact, onToggle }: { onAdd: (type: FlowNodeType) => void; compact: boolean; onToggle: () => void }) => (
  <aside className={cn('shrink-0 border-r border-input-border-color bg-bg-card overflow-y-auto transition-[width]', compact ? 'w-14' : 'w-56')}>
    <div className={cn('flex items-start gap-2 pt-3 pb-1', compact ? 'justify-center px-1' : 'px-3')}>
      {!compact && (
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-title">Steps</p>
          <p className="text-[11px] text-subtitle-color leading-snug">Drag onto the canvas, or click to add below the selected step.</p>
        </div>
      )}
      <button type="button" onClick={onToggle} aria-label={compact ? 'Show step names' : 'Collapse steps'} className="rounded-md p-1 text-subtitle-color hover:bg-primary/10 hover:text-primary">
        {compact ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
      </button>
    </div>
    {CATEGORIES.map((cat) => (
      <div key={cat.key} className={cn('pt-3', compact ? 'px-1.5' : 'px-2')}>
        {!compact && <p className="px-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-subtitle-color">{cat.label}</p>}
        {compact && <div className="mx-auto mb-1 h-px w-6 bg-input-border-color" />}
        {(Object.keys(NODE_META) as FlowNodeType[])
          .filter((type) => NODE_META[type].category === cat.key)
          .map((type) => {
            const meta = NODE_META[type]
            const Icon = meta.icon
            const button = (
              <button
                key={type}
                type="button"
                draggable
                aria-label={compact ? meta.label : undefined}
                onDragStart={(e) => {
                  e.dataTransfer.setData(DRAG_TYPE, type)
                  e.dataTransfer.effectAllowed = 'move'
                }}
                onClick={() => onAdd(type)}
                className={cn('group w-full flex items-center gap-2.5 rounded-lg py-1.5 text-left hover:bg-primary/5 cursor-grab active:cursor-grabbing', compact ? 'justify-center px-0' : 'px-2')}
              >
                <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', meta.tone)}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                {!compact && (
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-title group-hover:text-primary truncate">{meta.label}</span>
                    <span className="block text-[10px] text-subtitle-color truncate">{meta.description}</span>
                  </span>
                )}
              </button>
            )
            return compact ? <CustomTooltip key={type} title={meta.label} side="right">{button}</CustomTooltip> : button
          })}
      </div>
    ))}
    <div className="h-4" />
  </aside>
)

export default NodePalette
