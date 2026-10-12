'use client'

import { BuilderOptions, FlowTrigger } from '@/types/whatsappAutomation'
import { createContext, useContext } from 'react'

// What node cards and forms need from the editor without prop drilling.
export interface BuilderContextValue {
  variables: string[]
  options?: BuilderOptions
  errorsByNode: Record<string, string[]>
  warningsByNode: Record<string, string[]>
  // The step the test chat is at, highlighted on the canvas.
  activeNodeId: string | null
  trigger: FlowTrigger
  readOnly?: boolean
}

export const BuilderContext = createContext<BuilderContextValue>({
  variables: [],
  errorsByNode: {},
  warningsByNode: {},
  activeNodeId: null,
  trigger: { type: 'keyword', keywords: [], match: 'contains' },
})

export const useBuilder = () => useContext(BuilderContext)
