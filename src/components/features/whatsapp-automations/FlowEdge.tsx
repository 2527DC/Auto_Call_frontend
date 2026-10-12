'use client'

import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath, useReactFlow } from '@xyflow/react'
import { X } from 'lucide-react'
import { useBuilder } from './BuilderContext'

// A connection with a remove button that shows on hover or when selected.
const FlowEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, selected, style }: EdgeProps) => {
  const { setEdges } = useReactFlow()
  const { readOnly } = useBuilder()
  const [path, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 12 })

  return (
    <>
      <BaseEdge path={path} markerEnd={markerEnd} style={{ stroke: selected ? '#7C3AED' : '#a78bfa', strokeWidth: selected ? 2.5 : 2, ...style }} />
      {!readOnly && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, pointerEvents: 'all' }}
            className="absolute group p-3 nodrag nopan"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setEdges((edges) => edges.filter((edge) => edge.id !== id))
              }}
              aria-label="Remove connection"
              className={`flex h-5 w-5 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-500 shadow transition-opacity dark:bg-zinc-900 dark:border-rose-500/30 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default FlowEdge
