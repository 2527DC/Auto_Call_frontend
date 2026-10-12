'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textArea'
import { cn } from '@/lib/utils'
import { RequirementAnswer } from '@/types/priceEstimator'
import { CheckCircle2, Circle, ClipboardList, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { DEFAULT_QUESTIONS } from '../estimate'
import { Section } from '../fields'

const groupOf = (question: string) => DEFAULT_QUESTIONS.find((q) => q.question === question)?.group || 'Your questions'

const RequirementsSection = ({ requirements, notes, onChange, onNotes }: {
  requirements: RequirementAnswer[]
  notes: string
  onChange: (r: RequirementAnswer[]) => void
  onNotes: (v: string) => void
}) => {
  const [newQuestion, setNewQuestion] = useState('')
  const answered = requirements.filter((r) => r.answer.trim()).length
  const progress = requirements.length ? Math.round((answered / requirements.length) * 100) : 0

  const groups = requirements.reduce<Record<string, number[]>>((acc, r, i) => {
    const g = groupOf(r.question)
    ;(acc[g] ||= []).push(i)
    return acc
  }, {})

  const setAnswer = (i: number, answer: string) => onChange(requirements.map((r, j) => (j === i ? { ...r, answer } : r)))
  const remove = (i: number) => onChange(requirements.filter((_, j) => j !== i))
  const add = () => {
    const q = newQuestion.trim()
    if (!q) return
    onChange([...requirements, { question: q, answer: '' }])
    setNewQuestion('')
  }

  return (
    <Section
      step={2}
      icon={ClipboardList}
      title="Requirements & questions"
      description="Ask these on the discovery call. The answers drive the volumes and modules below."
      actions={
        <div className="flex items-center gap-2 text-xs text-subtitle-color">
          <div className="h-1.5 w-24 rounded-full bg-primary/10 overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="tabular-nums font-semibold">{answered}/{requirements.length} answered</span>
        </div>
      }
    >
      <div className="space-y-6">
        {Object.entries(groups).map(([group, indexes]) => (
          <div key={group} className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-subtitle-color">{group}</h3>
            {indexes.map((i) => {
              const r = requirements[i]
              const done = !!r.answer.trim()
              return (
                <div key={i} className="group grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1.5 items-start">
                  {done ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600" /> : <Circle className="w-4 h-4 mt-0.5 text-subtitle-color/50" />}
                  <Label htmlFor={`req-${i}`} className={cn('text-sm leading-snug', done ? 'text-subtitle-color' : 'text-title font-medium')}>{r.question}</Label>
                  <button type="button" onClick={() => remove(i)} aria-label="Remove question" className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-subtitle-color hover:text-destructive transition-opacity">
                    <X className="w-4 h-4" />
                  </button>
                  <Textarea
                    id={`req-${i}`}
                    rows={2}
                    value={r.answer}
                    onChange={(e) => setAnswer(i, e.target.value)}
                    placeholder="Client's answer…"
                    className="col-start-2 col-span-2 min-h-[44px] bg-input-color border-input-border-color text-sm"
                  />
                </div>
              )
            })}
          </div>
        ))}

        <div className="flex gap-2">
          <Input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
            placeholder="Add your own question…"
            className="h-10 bg-input-color border-input-border-color text-sm"
          />
          <Button type="button" variant="outline" onClick={add} disabled={!newQuestion.trim()} className="gap-1.5 h-10 shrink-0">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="quote-notes" className="text-xs font-semibold text-subtitle-color">Notes, objections & promises made</Label>
          <Textarea
            id="quote-notes"
            rows={3}
            value={notes}
            onChange={(e) => onNotes(e.target.value)}
            placeholder="e.g. Says Bolna quoted ₹4.5/min. Wants Kannada voice. Promised go-live in 7 days."
            className="bg-input-color border-input-border-color text-sm"
          />
        </div>
      </div>
    </Section>
  )
}

export default RequirementsSection
