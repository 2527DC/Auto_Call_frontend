import { FlowEdge, FlowNode, FlowTrigger, FlowValidation } from '@/types/whatsappAutomation'
import { LIMITS, MAX_DELAY_MINUTES, NODE_META } from './catalog'

const VAR_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/
const len = (s: unknown) => String(s ?? '').length
const blank = (s: unknown) => !String(s ?? '').trim()

// The same rules the backend checks before a flow can go live
// (Voxeno_backend/services/whatsapp/flowEngine.js validateFlow), so problems show while editing.
export const validateFlow = ({ nodes, edges, trigger }: { nodes: FlowNode[]; edges: FlowEdge[]; trigger: FlowTrigger }): FlowValidation => {
  const errors: FlowValidation['errors'] = []
  const warnings: FlowValidation['warnings'] = []
  const ids = new Set(nodes.map((n) => n.id))
  const label = (n: FlowNode) => n.data?.label || NODE_META[n.type]?.label || n.type

  const starts = nodes.filter((n) => n.type === 'start')
  if (starts.length !== 1) errors.push({ message: 'The flow needs exactly one Start step.' })
  if (trigger.type === 'keyword' && !(trigger.keywords || []).some((k) => String(k).trim())) {
    errors.push({ message: 'Add at least one keyword that starts this flow.' })
  }
  if (edges.some((e) => !ids.has(e.source) || !ids.has(e.target))) {
    errors.push({ message: 'A connection points to a step that no longer exists.' })
  }

  for (const n of nodes) {
    const d = n.data || {}
    const err = (message: string) => errors.push({ node_id: n.id, message: `${label(n)}: ${message}` })
    switch (n.type) {
      case 'message':
        if (blank(d.text) && !d.media?.url) err('add a message or a file.')
        if (len(d.text) > LIMITS.text) err('the message is too long.')
        break
      case 'buttons': {
        const buttons = d.buttons || []
        if (blank(d.text)) err('add the message text.')
        if (buttons.length < 1 || buttons.length > LIMITS.buttons) err('add 1 to 3 buttons.')
        if (new Set(buttons.map((b) => b.id)).size !== buttons.length) err('two buttons have the same id.')
        buttons.forEach((b) => {
          if (blank(b.title)) err('every button needs a title.')
          if (len(b.title) > LIMITS.button_title) err(`button "${b.title}" is longer than ${LIMITS.button_title} characters.`)
        })
        if (len(d.text) > LIMITS.body) err(`the text is longer than ${LIMITS.body} characters.`)
        if (len(d.header) > LIMITS.header) err(`the header is longer than ${LIMITS.header} characters.`)
        if (len(d.footer) > LIMITS.footer) err(`the footer is longer than ${LIMITS.footer} characters.`)
        break
      }
      case 'list': {
        const rows = (d.sections || []).flatMap((s) => s.rows || [])
        if (blank(d.text)) err('add the message text.')
        if (rows.length < 1 || rows.length > LIMITS.list_rows) err('add 1 to 10 options.')
        if (new Set(rows.map((r) => r.id)).size !== rows.length) err('two options have the same id.')
        rows.forEach((r) => {
          if (blank(r.title)) err('every option needs a title.')
          if (len(r.title) > LIMITS.row_title) err(`option "${r.title}" is longer than ${LIMITS.row_title} characters.`)
          if (len(r.description) > LIMITS.row_description) err(`the description of "${r.title}" is longer than ${LIMITS.row_description} characters.`)
        })
        if (len(d.button_label) > LIMITS.list_button) err(`the menu button label is longer than ${LIMITS.list_button} characters.`)
        if (len(d.text) > LIMITS.body) err(`the text is longer than ${LIMITS.body} characters.`)
        break
      }
      case 'question':
        if (blank(d.text)) err('add the question.')
        if (!VAR_RE.test(d.variable || '')) err('choose a variable name (letters, numbers and _).')
        break
      case 'condition':
        if (!(d.rules || []).length) err('add at least one rule.')
        ;(d.rules || []).forEach((r, i) => {
          if ((r.subject === 'var' || r.subject === 'contact') && !String(r.key || '').trim()) {
            warnings.push({ node_id: n.id, message: `${label(n)}: rule ${i + 1} has no ${r.subject === 'var' ? 'variable' : 'field'} chosen.` })
          }
        })
        break
      case 'delay': {
        const minutes = Number(d.amount) * (d.unit === 'hours' ? 60 : 1)
        if (!(minutes > 0)) err('set how long to wait.')
        if (minutes > MAX_DELAY_MINUTES) err('wait at most 23 hours (WhatsApp only allows replies within 24 hours).')
        break
      }
      case 'set_variable':
        if (!VAR_RE.test(d.variable || '')) err('choose a variable name.')
        break
      case 'webhook':
        if (!/^https?:\/\//.test(d.url || '')) err('add a URL starting with http:// or https://.')
        break
      case 'appointment':
        if (blank(d.text)) err('add the message that offers the slots.')
        break
      case 'voice_call':
        if (!d.agent_id) err('choose the AI voice agent that will call.')
        if (!d.from_number) err('choose the number to call from.')
        break
      default:
        break
    }
  }

  // Options with nothing connected end the flow when tapped: fine sometimes, but often a slip.
  for (const n of nodes.filter((x) => x.type === 'buttons' || x.type === 'list')) {
    const used = new Set(edges.filter((e) => e.source === n.id).map((e) => e.sourceHandle))
    const options = n.type === 'buttons'
      ? (n.data.buttons || []).map((b) => ({ handle: `btn:${b.id}`, title: b.title }))
      : (n.data.sections || []).flatMap((s) => s.rows || []).map((r) => ({ handle: `row:${r.id}`, title: r.title }))
    const loose = options.filter((o) => !used.has(o.handle))
    if (loose.length) warnings.push({ node_id: n.id, message: `${label(n)}: ${loose.map((o) => `"${o.title || 'untitled'}"`).join(', ')} ${loose.length > 1 ? 'are' : 'is'} not connected, so tapping it ends the flow.` })
  }

  if (starts.length === 1) {
    const reachable = new Set([starts[0].id])
    const queue = [starts[0].id]
    while (queue.length) {
      const id = queue.shift() as string
      for (const e of edges.filter((x) => x.source === id)) {
        if (!reachable.has(e.target)) {
          reachable.add(e.target)
          queue.push(e.target)
        }
      }
    }
    nodes.filter((n) => !reachable.has(n.id)).forEach((n) => warnings.push({ node_id: n.id, message: `${label(n)} is not connected, so it never runs.` }))
  }

  return { errors, warnings }
}
