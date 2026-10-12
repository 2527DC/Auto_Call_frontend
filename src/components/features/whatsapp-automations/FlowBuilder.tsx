'use client'

import Spinner from '@/components/reusable/Spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import { useGetWaBuilderOptionsQuery, useGetWaFlowQuery, useSetWaFlowStatusMutation, useUpdateWaFlowMutation } from '@/redux/api/whatsappAutomationApi'
import { useAppDispatch } from '@/redux/hooks'
import { setSidebarCollapsed } from '@/redux/slices/layoutSlice'
import { BuilderOptions, FlowEdge, FlowNodeData, FlowNodeType, FlowValidation, WhatsappFlow } from '@/types/whatsappAutomation'
import {
  Background,
  BackgroundVariant,
  Connection,
  ConnectionLineType,
  Controls,
  Edge,
  IsValidConnection,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { AlertCircle, AlertTriangle, ArrowLeft, ChevronDown, FlaskConical, History, Loader2, Pause, Play, Save } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DragEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { BuilderContext } from './BuilderContext'
import { defaultData, flowVariables, NODE_META, outputsOf, shortId } from './catalog'
import FlowEdgeView from './FlowEdge'
import FlowNodeCard, { CanvasData, CanvasNode } from './FlowNodeCard'
import NodePalette, { DRAG_TYPE } from './NodePalette'
import RunsDrawer from './RunsDrawer'
import { NodePanel, SettingsPanel } from './SidePanel'
import Simulator from './Simulator'
import { validateFlow } from './validate'

const nodeTypes = Object.fromEntries(Object.keys(NODE_META).map((t) => [t, FlowNodeCard]))
const edgeTypes = { wa: FlowEdgeView }
const marker = { type: MarkerType.ArrowClosed, color: '#a78bfa', width: 18, height: 18 }

const toCanvasEdge = (e: FlowEdge): Edge => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle || 'next', type: 'wa', markerEnd: marker })

type Meta = Pick<WhatsappFlow, 'name' | 'description' | 'trigger' | 'settings' | 'priority'>

const STATUS_BADGE: Record<WhatsappFlow['status'], { label: string; tone: string }> = {
  active: { label: 'Live', tone: 'bg-emerald-500/10 text-emerald-600' },
  paused: { label: 'Paused', tone: 'bg-amber-500/10 text-amber-600' },
  draft: { label: 'Draft', tone: 'bg-zinc-500/10 text-zinc-500' },
}

const apiError = (err: unknown) => (err as { data?: { message?: string; validation?: FlowValidation }; status?: number }) || {}

const Editor = ({ flow, options, initialPanel }: { flow: WhatsappFlow; options?: BuilderOptions; initialPanel: 'config' | 'test' | 'runs' }) => {
  const router = useRouter()
  const { screenToFlowPosition, setCenter, getZoom } = useReactFlow()
  const wrapper = useRef<HTMLDivElement>(null)
  const [updateFlow, { isLoading: saving }] = useUpdateWaFlowMutation()
  const [setFlowStatus, { isLoading: switching }] = useSetWaFlowStatusMutation()

  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>(
    flow.nodes.map((n) => ({ id: n.id, type: n.type, position: n.position, data: (n.data || {}) as CanvasData }))
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(flow.edges.map(toCanvasEdge))
  const [meta, setMeta] = useState<Meta>({ name: flow.name, description: flow.description || '', trigger: flow.trigger, settings: flow.settings, priority: flow.priority ?? 100 })
  const [status, setStatus] = useState<WhatsappFlow['status']>(flow.status)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panel, setPanel] = useState<'config' | 'test' | 'runs'>(initialPanel)
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const [showIssues, setShowIssues] = useState(true)
  // Steps palette collapses to icons on narrower screens.
  const [compactPalette, setCompactPalette] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1440)

  const definition = useCallback(() => ({
    ...meta,
    nodes: nodes.map((n) => ({ id: n.id, type: n.type as FlowNodeType, position: { x: Math.round(n.position.x), y: Math.round(n.position.y) }, data: n.data })),
    edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle || 'next' })),
  }), [meta, nodes, edges])

  const snapshot = JSON.stringify(definition())
  const [saved, setSaved] = useState(snapshot)
  const dirty = snapshot !== saved

  const def = definition()
  const validation = useMemo(() => validateFlow({ nodes: def.nodes, edges: def.edges, trigger: meta.trigger }), [snapshot]) // eslint-disable-line react-hooks/exhaustive-deps
  const byNode = (list: FlowValidation['errors']) =>
    list.reduce<Record<string, string[]>>((acc, i) => {
      if (i.node_id) (acc[i.node_id] ||= []).push(i.message.replace(/^[^:]+:\s*/, ''))
      return acc
    }, {})
  const errorsByNode = useMemo(() => byNode(validation.errors), [validation])
  const warningsByNode = useMemo(() => byNode(validation.warnings), [validation])
  const variables = useMemo(() => flowVariables(def.nodes), [snapshot]) // eslint-disable-line react-hooks/exhaustive-deps

  const selected = nodes.find((n) => n.id === selectedId) || null

  const patchNode = useCallback((id: string, patch: Partial<FlowNodeData>) => {
    let outputs: string[] | null = null
    setNodes((ns) => ns.map((n) => {
      if (n.id !== id) return n
      const data = { ...n.data, ...patch } as CanvasData
      if (n.type === 'buttons' || n.type === 'list') outputs = outputsOf(n.type, data).map((o) => o.id)
      return { ...n, data }
    }))
    // A removed button or option takes its connection with it.
    setEdges((es) => (outputs ? es.filter((e) => e.source !== id || outputs!.includes(e.sourceHandle || 'next')) : es))
  }, [setNodes, setEdges])

  const addNode = useCallback((type: FlowNodeType, at?: { x: number; y: number }) => {
    const id = `${type}_${shortId()}`
    const data = defaultData(type, flowVariables(nodes.map((n) => ({ type: n.type as FlowNodeType, data: n.data }))))
    let position = at
    let link: { source: string; handle: string } | null = null
    if (!position) {
      const from = selected || (nodes.length === 1 ? nodes[0] : null)
      if (from) {
        const outs = outputsOf(from.type as FlowNodeType, from.data)
        const used = new Set(edges.filter((e) => e.source === from.id).map((e) => e.sourceHandle || 'next'))
        const free = outs.find((o) => !used.has(o.id))
        const index = free ? outs.indexOf(free) : 0
        position = { x: from.position.x + (outs.length > 1 ? (index - (outs.length - 1) / 2) * 300 : 0), y: from.position.y + (from.measured?.height ?? 160) + 70 }
        if (free) link = { source: from.id, handle: free.id }
      } else {
        const box = wrapper.current?.getBoundingClientRect()
        position = box ? screenToFlowPosition({ x: box.left + box.width / 2, y: box.top + box.height / 3 }) : { x: 200, y: 200 }
      }
    }
    // Don't drop it on top of another step.
    for (let guard = 0; guard < 25 && nodes.some((n) => Math.abs(n.position.x - position!.x) < 200 && Math.abs(n.position.y - position!.y) < 90); guard++) {
      position = { x: position!.x + 40, y: position!.y + 60 }
    }
    setNodes((ns) => [...ns.map((n) => ({ ...n, selected: false })), { id, type, position: position!, data: data as CanvasData, selected: true }])
    if (link) {
      const { source, handle } = link
      setEdges((es) => [...es, toCanvasEdge({ id: `e_${source}_${handle}_${id}`, source, target: id, sourceHandle: handle })])
    }
    setSelectedId(id)
    setPanel('config')
    // Keep the new step in view.
    if (!at) requestAnimationFrame(() => setCenter(position!.x + 120, position!.y + 80, { zoom: getZoom(), duration: 300 }))
  }, [nodes, edges, selected, screenToFlowPosition, setNodes, setEdges, setCenter, getZoom])

  const removeNode = useCallback((id: string) => {
    setNodes((ns) => ns.filter((n) => n.id !== id || n.type === 'start'))
    setEdges((es) => es.filter((e) => e.source !== id && e.target !== id))
    setSelectedId(null)
  }, [setNodes, setEdges])

  const duplicateNode = useCallback((id: string) => {
    const src = nodes.find((n) => n.id === id)
    if (!src || src.type === 'start') return
    const copy = { id: `${src.type}_${shortId()}`, type: src.type, position: { x: src.position.x + 40, y: src.position.y + 40 }, data: JSON.parse(JSON.stringify(src.data)), selected: true }
    setNodes((ns) => [...ns.map((n) => ({ ...n, selected: false })), copy])
    setSelectedId(copy.id)
  }, [nodes, setNodes])

  // One connection per output: connecting it again replaces the old one.
  const onConnect = useCallback((c: Connection) => {
    if (!c.source || !c.target || c.source === c.target) return
    const handle = c.sourceHandle || 'next'
    setEdges((es) => [
      ...es.filter((e) => !(e.source === c.source && (e.sourceHandle || 'next') === handle)),
      toCanvasEdge({ id: `e_${c.source}_${handle}_${c.target}`, source: c.source!, target: c.target!, sourceHandle: handle }),
    ])
  }, [setEdges])

  const isValidConnection: IsValidConnection = useCallback((c) => {
    if (c.source === c.target) return false
    return nodes.find((n) => n.id === c.target)?.type !== 'start'
  }, [nodes])

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.getData(DRAG_TYPE) as FlowNodeType
    if (!type || !NODE_META[type]) return
    addNode(type, screenToFlowPosition({ x: e.clientX - 120, y: e.clientY - 30 }))
  }, [addNode, screenToFlowPosition])

  const focusNode = (id?: string) => {
    if (!id) return
    const n = nodes.find((x) => x.id === id)
    if (!n) return
    setSelectedId(id)
    setPanel('config')
    setNodes((ns) => ns.map((x) => ({ ...x, selected: x.id === id })))
    setCenter(n.position.x + 120, n.position.y + 80, { zoom: Math.max(getZoom(), 0.9), duration: 400 })
  }

  const save = useCallback(async () => {
    const body = definition()
    try {
      const res = await updateFlow({ id: flow.id, body }).unwrap()
      setSaved(JSON.stringify(body))
      const problems = res.validation?.errors?.length || 0
      if (problems) toast.warning(`Saved. Fix ${problems} problem${problems > 1 ? 's' : ''} before switching it on.`)
      else toast.success('Automation saved')
      return true
    } catch (err) {
      const e = apiError(err)
      toast.error(e.data?.message || 'Could not save the automation')
      if (e.data?.validation) setShowIssues(true)
      return false
    }
  }, [definition, updateFlow, flow.id])

  const toggleLive = async () => {
    if (status === 'active') {
      try {
        await setFlowStatus({ id: flow.id, status: 'paused' }).unwrap()
        setStatus('paused')
        toast.success('Automation paused')
      } catch (err) {
        toast.error(apiError(err).data?.message || 'Could not pause it')
      }
      return
    }
    if (validation.errors.length) {
      setShowIssues(true)
      toast.error(`Fix ${validation.errors.length} problem${validation.errors.length > 1 ? 's' : ''} first.`)
      return
    }
    if (dirty && !(await save())) return
    try {
      await setFlowStatus({ id: flow.id, status: 'active' }).unwrap()
      setStatus('active')
      toast.success('Automation is live. It answers matching WhatsApp messages now.')
    } catch (err) {
      const e = apiError(err)
      toast.error(e.data?.validation?.errors?.[0]?.message || e.data?.message || 'Could not switch it on')
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        save()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [save])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const back = () => {
    if (dirty && !window.confirm('You have unsaved changes. Leave without saving?')) return
    router.push(ROUTES.WHATSAPP_AUTOMATIONS)
  }

  const firstKeyword = meta.trigger.type === 'keyword' ? meta.trigger.keywords[0] || 'hi' : 'hi'
  const badge = STATUS_BADGE[status]
  const issueCount = validation.errors.length + validation.warnings.length

  return (
    <BuilderContext.Provider value={{ variables, options, errorsByNode, warningsByNode, activeNodeId, trigger: meta.trigger }}>
      <div className="h-[calc(100dvh-99px)] min-h-[560px] flex flex-col rounded-lg overflow-hidden border border-input-border-color bg-bg-card">
        <header className="flex flex-wrap items-center gap-3 border-b border-input-border-color px-3 py-2.5">
          <Button type="button" variant="ghost" size="icon" onClick={back} aria-label="Back to automations" className="bg-primary/10 text-primary hover:bg-primary/20">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Input
              value={meta.name}
              onChange={(e) => setMeta((m) => ({ ...m, name: e.target.value }))}
              aria-label="Automation name"
              className="h-9 max-w-xs border-transparent bg-transparent px-2 text-base font-semibold text-title hover:border-input-border-color focus:border-primary"
            />
            <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', badge.tone)}>{badge.label}</span>
            {dirty && <span className="shrink-0 flex items-center gap-1 text-[11px] text-amber-600"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Unsaved</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" aria-pressed={panel === 'runs'} onClick={() => setPanel((p) => (p === 'runs' ? 'config' : 'runs'))} className={cn('gap-1.5', panel === 'runs' && 'bg-primary/10 text-primary border-primary/40')}>
              <History className="w-4 h-4" /> Runs
            </Button>
            <Button type="button" variant="outline" aria-pressed={panel === 'test'} onClick={() => setPanel((p) => (p === 'test' ? 'config' : 'test'))} className={cn('gap-1.5', panel === 'test' && 'bg-primary/10 text-primary border-primary/40')}>
              <FlaskConical className="w-4 h-4" /> Test
            </Button>
            <Button type="button" variant="outline" onClick={() => save()} disabled={saving || !dirty} className="gap-1.5" title="Save (Ctrl/⌘ + S)">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </Button>
            <Button type="button" onClick={toggleLive} disabled={switching || saving} className={cn('gap-1.5', status === 'active' && 'bg-amber-500 hover:bg-amber-600 text-white')}>
              {switching ? <Loader2 className="w-4 h-4 animate-spin" /> : status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {status === 'active' ? 'Pause' : 'Go live'}
            </Button>
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          <NodePalette onAdd={(t) => addNode(t)} compact={compactPalette} onToggle={() => setCompactPalette((c) => !c)} />

          <div className="relative flex-1 min-w-0" ref={wrapper} onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }} onDrop={onDrop}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              isValidConnection={isValidConnection}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodeClick={(_, n) => { setSelectedId(n.id); if (panel !== 'test') setPanel('config') }}
              onPaneClick={() => setSelectedId(null)}
              onBeforeDelete={async ({ nodes: ns, edges: es }) => ({ nodes: ns.filter((n) => n.type !== 'start'), edges: es })}
              onNodesDelete={(ns) => ns.some((n) => n.id === selectedId) && setSelectedId(null)}
              deleteKeyCode={['Backspace', 'Delete']}
              connectionLineType={ConnectionLineType.SmoothStep}
              connectionLineStyle={{ stroke: '#7C3AED', strokeWidth: 2 }}
              fitView
              fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
              minZoom={0.2}
              proOptions={{ hideAttribution: true }}
            >
              <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="#a78bfa55" />
              <Controls className="!bg-bg-card !border-input-border-color !shadow-md !rounded-lg overflow-hidden" />
              <MiniMap className="!bg-bg-card !border !border-input-border-color !rounded-lg" style={{ width: 150, height: 100 }} pannable zoomable nodeColor={(n) => (errorsByNode[n.id] ? '#ef4444' : n.id === activeNodeId ? '#10b981' : '#a78bfa')} maskColor="rgba(124,58,237,0.06)" />
            </ReactFlow>

            {issueCount > 0 && (
              <div className="absolute left-3 top-3 z-10 w-80 max-w-[calc(100%-1.5rem)] rounded-lg border border-input-border-color bg-bg-card shadow-lg">
                <button type="button" onClick={() => setShowIssues((s) => !s)} className="w-full flex items-center gap-2 px-3 py-2 text-left" aria-expanded={showIssues}>
                  {validation.errors.length > 0 ? <AlertCircle className="w-4 h-4 text-destructive" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  <span className="flex-1 text-xs font-semibold text-title">
                    {validation.errors.length > 0 && `${validation.errors.length} problem${validation.errors.length > 1 ? 's' : ''}`}
                    {validation.errors.length > 0 && validation.warnings.length > 0 && ' · '}
                    {validation.warnings.length > 0 && `${validation.warnings.length} warning${validation.warnings.length > 1 ? 's' : ''}`}
                  </span>
                  <ChevronDown className={cn('w-4 h-4 text-subtitle-color transition-transform', showIssues && 'rotate-180')} />
                </button>
                {showIssues && (
                  <ul className="max-h-56 overflow-y-auto border-t border-input-border-color py-1">
                    {[...validation.errors.map((i) => ({ ...i, kind: 'error' as const })), ...validation.warnings.map((i) => ({ ...i, kind: 'warning' as const }))].map((i, k) => (
                      <li key={k}>
                        <button type="button" onClick={() => (i.node_id ? focusNode(i.node_id) : (setSelectedId(null), setPanel('config')))} className="w-full flex gap-2 px-3 py-1.5 text-left text-[11px] hover:bg-primary/5">
                          {i.kind === 'error' ? <AlertCircle className="w-3.5 h-3.5 shrink-0 text-destructive mt-px" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500 mt-px" />}
                          <span className="text-title">{i.message}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {panel === 'test' ? (
            <Simulator flowId={flow.id} flowName={meta.name} firstKeyword={firstKeyword} getDefinition={definition} onActiveNode={setActiveNodeId} onClose={() => setPanel('config')} />
          ) : panel === 'runs' ? (
            <RunsDrawer flowId={flow.id} onClose={() => setPanel('config')} />
          ) : (
            <aside className="w-[340px] shrink-0 border-l border-input-border-color bg-bg-card">
              {selected ? (
                <NodePanel
                  key={selected.id}
                  id={selected.id}
                  type={selected.type as FlowNodeType}
                  data={selected.data}
                  onChange={(patch) => patchNode(selected.id, patch)}
                  onDelete={() => removeNode(selected.id)}
                  onDuplicate={() => duplicateNode(selected.id)}
                  onClose={() => setSelectedId(null)}
                  onOpenSettings={() => setSelectedId(null)}
                />
              ) : (
                <SettingsPanel
                  trigger={meta.trigger}
                  settings={meta.settings}
                  priority={meta.priority}
                  description={meta.description}
                  onTrigger={(trigger) => setMeta((m) => ({ ...m, trigger }))}
                  onSettings={(settings) => setMeta((m) => ({ ...m, settings }))}
                  onPriority={(priority) => setMeta((m) => ({ ...m, priority }))}
                  onDescription={(description) => setMeta((m) => ({ ...m, description }))}
                />
              )}
            </aside>
          )}
        </div>
      </div>
    </BuilderContext.Provider>
  )
}

// Loads the flow and the dropdown options, then opens the editor.
const FlowBuilder = ({ id }: { id: string }) => {
  const dispatch = useAppDispatch()
  const params = useSearchParams()
  const initialPanel = params.get('panel') === 'runs' ? 'runs' : params.get('panel') === 'test' ? 'test' : 'config'
  const { data, isLoading, isError } = useGetWaFlowQuery(id, { refetchOnMountOrArgChange: true })
  const { data: options } = useGetWaBuilderOptionsQuery()

  useEffect(() => {
    dispatch(setSidebarCollapsed(true))
    return () => {
      dispatch(setSidebarCollapsed(false))
    }
  }, [dispatch])

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Spinner /></div>
  if (isError || !data?.data) return <div className="p-10 text-center text-subtitle-color">This automation could not be found.</div>

  return (
    <ReactFlowProvider>
      <Editor key={data.data.id} flow={data.data} options={options?.data} initialPanel={initialPanel} />
    </ReactFlowProvider>
  )
}

export default FlowBuilder
