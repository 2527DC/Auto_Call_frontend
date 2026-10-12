'use client'

import { CustomTooltip } from '@/components/reusable/CustomTooltip'
import { cn } from '@/lib/utils'
import { FlowNodeData, FlowNodeType } from '@/types/whatsappAutomation'
import { Handle, Node, NodeProps, Position } from '@xyflow/react'
import { AlertCircle, AlertTriangle, ListChecks, Paperclip } from 'lucide-react'
import { memo } from 'react'
import { useBuilder } from './BuilderContext'
import { NODE_META, nodePreview, outputsOf, triggerSummary } from './catalog'

// React Flow wants node data to be an open record.
export type CanvasData = FlowNodeData & Record<string, unknown>
export type CanvasNode = Node<CanvasData, FlowNodeType>

const handleClass = '!w-3 !h-3 !border-2 !border-white dark:!border-zinc-900 !bg-primary'

const Bubble = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg rounded-tl-none bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1.5 text-[11px] text-zinc-700 dark:text-zinc-200 leading-snug whitespace-pre-line line-clamp-3 break-words">
    {children}
  </div>
)

const Empty = ({ children }: { children: React.ReactNode }) => <p className="text-[11px] italic text-subtitle-color">{children}</p>

const FlowNodeCard = ({ id, type, data, selected }: NodeProps<CanvasNode>) => {
  const { errorsByNode, warningsByNode, activeNodeId, trigger } = useBuilder()
  const meta = NODE_META[type]
  const Icon = meta.icon
  const errors = errorsByNode[id] || []
  const warnings = warningsByNode[id] || []
  const outputs = outputsOf(type, data)
  const single = outputs.length === 1 && outputs[0].id === 'next'
  const isActive = activeNodeId === id
  const preview = nodePreview(type, data)

  return (
    <div
      className={cn(
        'w-[240px] rounded-xl border bg-bg-card shadow-sm transition-shadow',
        selected ? 'border-primary ring-2 ring-primary/30' : 'border-input-border-color',
        errors.length > 0 && 'border-destructive ring-2 ring-destructive/20',
        isActive && 'ring-4 ring-emerald-400/50 border-emerald-500 shadow-lg shadow-emerald-500/20'
      )}
    >
      {type !== 'start' && <Handle type="target" position={Position.Top} className={handleClass} />}

      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-input-border-color">
        <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', meta.tone)}>
          <Icon className="w-4 h-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-title truncate">{data.label || meta.label}</p>
          {data.label && <p className="text-[10px] text-subtitle-color">{meta.label}</p>}
        </div>
        {errors.length > 0 ? (
          <CustomTooltip title={errors.join(' · ')}>
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          </CustomTooltip>
        ) : warnings.length > 0 ? (
          <CustomTooltip title={warnings.join(' · ')}>
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          </CustomTooltip>
        ) : null}
      </div>

      <div className="px-3 py-2.5 space-y-2">
        {type === 'start' && <p className="text-[11px] text-subtitle-color leading-snug">{triggerSummary(trigger)}</p>}
        {(type === 'message' || type === 'buttons' || type === 'list' || type === 'question' || type === 'appointment') &&
          (data.text ? <Bubble>{data.text}</Bubble> : !data.media?.url && <Empty>No text yet</Empty>)}
        {type === 'message' && data.media?.url && (
          <p className="flex items-center gap-1 text-[11px] text-subtitle-color"><Paperclip className="w-3 h-3" /> {data.media.filename || data.media.type}</p>
        )}
        {type === 'list' && (
          <p className="flex items-center gap-1 text-[11px] font-semibold text-sky-600"><ListChecks className="w-3 h-3" /> {data.button_label || 'Choose'}</p>
        )}
        {type === 'question' && data.variable && (
          <p className="text-[11px] text-subtitle-color">Saves to <code className="text-primary">{data.variable}</code>{data.validation && data.validation !== 'any' ? ` · ${data.validation}` : ''}</p>
        )}
        {!['start', 'message', 'buttons', 'list', 'question', 'appointment'].includes(type) && (
          preview ? <p className="text-[11px] text-subtitle-color leading-snug line-clamp-2 break-words">{preview}</p> : null
        )}
      </div>

      {!single && outputs.length > 0 && (
        <div className="border-t border-input-border-color py-1">
          {outputs.map((o) => (
            <div key={o.id} className="relative flex items-center justify-end gap-2 px-3 py-1">
              <span
                className={cn(
                  'text-[11px] font-medium truncate max-w-[180px]',
                  o.tone === 'good' ? 'text-emerald-600' : o.tone === 'bad' ? 'text-rose-500' : 'text-title'
                )}
              >
                {o.label}
              </span>
              <Handle type="source" id={o.id} position={Position.Right} className={handleClass} style={{ right: -7 }} />
            </div>
          ))}
        </div>
      )}
      {(type === 'buttons' || type === 'list') && outputs.length === 0 && (
        <div className="px-3 pb-2.5"><Empty>Add {type === 'buttons' ? 'buttons' : 'options'} to connect</Empty></div>
      )}

      {single && <Handle type="source" id="next" position={Position.Bottom} className={handleClass} />}
    </div>
  )
}

export default memo(FlowNodeCard)
