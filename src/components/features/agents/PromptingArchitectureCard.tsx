'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textArea'
import { PromptingArchitectureCardProps } from '@/types/agent'
import { Sparkles, Tag, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const KANNADA_LOCAL_TEMPLATE = `# ROLE & AGENT PERSONA
You are a friendly, intelligent voice executive for [Business Name]. Your goal is to understand what the caller needs, qualify their interest, and guide them to the next step.

# LANGUAGE & LOCAL KANNADA STYLE (CRITICAL)
1. Speak in natural, everyday conversational Kannada (ಸ್ಥಳೀಯ ಆಡುಭಾಷೆ), NOT formal, literary, or ancient bookish Kannada.
2. Naturally mix common English loan words used daily in Bengaluru/Karnataka like "cycle", "model", "price", "discount", "offer", "EMI", "service", "showroom", "location", "WhatsApp", "test ride", "booking".
   • Good conversational style: "ನಮಸ್ಕಾರ! ಭಾರತ್ ಸೈಕಲ್ಸ್‌ಗೆ ಸ್ವಾಗತ. ನೀವು ಹೊಸ ಸೈಕಲ್ ನೋಡ್ತಿದ್ದೀರಾ ಅಥವಾ ಸರ್ವಿಸ್ ಬಗ್ಗೆ ಎನ್‌ಕ್ವೈರಿ ಮಾಡ್ಬೇಕಿತ್ತಾ?"
   • Avoid bookish style: "ದ್ವಿಚಕ್ರ ವಾಹನದ ಮಳಿಗೆಗೆ ಸುಸ್ವಾಗತ, ತಾವು ಯಾವ ವಾಹನವನ್ನು ಬಯಸುವಿರಿ?"
3. Keep each response concise (1 to 2 sentences maximum). Do not lecture or overload the caller.
4. End every turn with one clear, friendly question.

# INBOUND CALL FLOW & NEXT STEPS
- HOT / READY TO BUY: Confirm their preferred day and time for a showroom visit or test ride. Let them know the Google Maps location will arrive on their WhatsApp.
- ENQUIRY / COMPARISON: Offer to send the product catalogue with photos and pricing directly to their WhatsApp.
- EXIT & GOODBYE: When the caller has no more queries, say: "ತುಂಬಾ ಧನ್ಯವಾದಗಳು, Have a wonderful day! Goodbye!" and conclude the call cleanly.`

const LEAD_QUALIFICATION_TEMPLATE = `# AGENT ROLE
You are a professional sales & consultation assistant for [Business Name].

# OBJECTIVE
1. Greet the caller warmly and identify their main requirement.
2. Qualify their timeline, preference, and key criteria.
3. Offer the immediate next step (Store visit, WhatsApp brochure, or Callback from specialist).

# GUARDRAILS
- Speak conversationally and keep replies under 2 sentences.
- Never interrogate or ask intrusive personal questions.
- If the caller says goodbye, thanks, or has no further questions, end gracefully with a warm goodbye.`

export function PromptingArchitectureCard({
  systemPrompt,
  setSystemPrompt,
  firstMessage,
  setFirstMessage,
  goodbyeMessage,
  setGoodbyeMessage
}: PromptingArchitectureCardProps) {
  const { t } = useTranslation()

  const insertVariable = (variable: string) => {
    setSystemPrompt((prev) => (prev ? `${prev} ${variable}` : variable))
  }

  const applyTemplate = (template: string) => {
    if (systemPrompt && !window.confirm('Do you want to replace your current system prompt with this template?')) {
      return
    }
    setSystemPrompt(template)
  }

  return (
    <div className="bg-bg-card p-4 sm:p-6 rounded-radius border border-input-border-color">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-black text-title flex items-center gap-1.5">
            <span>{t('instructions_architecture', 'Instructions & Prompt Architecture')}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Define how your AI assistant speaks, behaves, and handles callers.
          </p>
        </div>

        {/* Quick Template Fill Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyTemplate(KANNADA_LOCAL_TEMPLATE)}
            className="text-xs font-bold border-primary/30 text-primary hover:bg-primary/10 gap-1.5 h-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Local Kannada (ಆಡುಭಾಷೆ) Template</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyTemplate(LEAD_QUALIFICATION_TEMPLATE)}
            className="text-xs font-bold gap-1.5 h-8"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Lead Qualifier Template</span>
          </Button>
        </div>
      </div>

      {/* Variables & Tags Toolbar */}
      <div className="mb-6 bg-input-color/60 p-3 rounded-lg border border-input-border-color flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
          <Tag className="w-3 h-3" />
          <span>Insert Variables:</span>
        </span>
        {['{{caller_name}}', '{{caller_phone}}', '{{company_name}}', '{{current_time}}', '{{store_location}}'].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => insertVariable(v)}
            className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-bg-card border border-input-border-color hover:border-primary text-foreground transition-all cursor-pointer"
          >
            {v}
          </button>
        ))}
        <span className="text-[11px] text-muted-foreground ml-auto hidden sm:inline">
          Estimated: ~{Math.round((systemPrompt || '').length / 4)} tokens
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Core System Prompt */}
        <div className="flex flex-col h-full">
          <Label className="text-md font-medium text-title mb-3">
            {t('system_instruction')}
          </Label>
          <Textarea
            placeholder={t('system_prompt_placeholder')}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="flex-1 min-h-[200px] rounded-radius bg-input-color border-input-border-color font-bold sm:p-6 p-4 text-sm leading-relaxed focus:bg-input-color transition-all resize-none"
          />
        </div>

        {/* Initial Contact Message */}
        <div className="flex flex-col h-full">
          <Label className="text-md font-medium text-title mb-3">
            {t('welcome_message')}
          </Label>
          <Textarea
            placeholder={t('first_message_placeholder')}
            value={firstMessage}
            onChange={(e) => setFirstMessage(e.target.value)}
            className="flex-1 min-h-[200px] rounded-radius bg-input-color border-input-border-color font-bold sm:p-6 p-4 text-sm leading-relaxed focus:bg-input-color transition-all resize-none"
          />
        </div>

        {/* Goodbye Message */}
        <div className="flex flex-col h-full">
          <Label className="text-md font-medium text-title mb-3 block">
            {t('goodbye_message')}
          </Label>
          <Textarea
            placeholder={t('goodbye_message_placeholder')}
            value={goodbyeMessage}
            onChange={(e) => setGoodbyeMessage(e.target.value)}
            className="flex-1 min-h-[200px] rounded-radius bg-input-color border-input-border-color font-bold sm:p-6 p-4 text-sm leading-relaxed focus:bg-input-color transition-all resize-none"
          />
        </div>
      </div>
    </div>
  )
}
