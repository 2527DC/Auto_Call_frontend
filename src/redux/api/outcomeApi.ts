import { baseApi } from './baseApi'
import {
  CallOutcome,
  FollowUpMode,
  FollowUpRow,
  FollowUpsResponse,
  FollowUpTab,
  LeadDetail,
  LeadInfo,
  LeadsResponse,
  OutcomePreset,
  OutcomeSettings,
  OutcomeTestResult,
} from '@/types/outcomes'

type Ok<T> = { success: boolean; message?: string; data: T }

export interface LeadsQuery {
  page?: number
  limit?: number
  status?: string
  q?: string
  source?: string
  agent_id?: string
  campaign_id?: string
  due?: 'today'
  all?: boolean
}

export interface FollowUpsQuery {
  tab?: FollowUpTab
  page?: number
  limit?: number
  mode?: FollowUpMode
  q?: string
  contact_id?: string
}

// Leaves out empty filters so the backend only sees what was chosen.
const clean = <T extends object>(params?: T) =>
  Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== '' && v !== null && v !== false))

export const outcomeApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // ---------- settings ----------
    getOutcomeSettings: builder.query<Ok<{ settings: OutcomeSettings; presets: OutcomePreset[]; whatsapp_templates?: { id: string; name: string; language: string }[] }>, void>({
      query: () => ({ url: '/outcomes/settings' }),
      providesTags: ['OutcomeSettings'],
    }),
    updateOutcomeSettings: builder.mutation<Ok<OutcomeSettings>, Partial<OutcomeSettings>>({
      query: (body) => ({ url: '/outcomes/settings', method: 'PUT', body }),
      invalidatesTags: ['OutcomeSettings', 'Lead'],
    }),
    applyOutcomePreset: builder.mutation<Ok<OutcomeSettings>, { preset: string }>({
      query: (body) => ({ url: '/outcomes/settings/preset', method: 'POST', body }),
      invalidatesTags: ['OutcomeSettings', 'Lead'],
    }),
    testOutcomeOnCall: builder.mutation<Ok<OutcomeTestResult>, { call_id: string }>({
      query: (body) => ({ url: '/outcomes/settings/test', method: 'POST', body }),
    }),

    // ---------- a call's outcome ----------
    setCallOutcome: builder.mutation<Ok<CallOutcome>, { id: string; key: string; note?: string }>({
      query: ({ id, ...body }) => ({ url: `/outcomes/calls/${id}`, method: 'PUT', body }),
      invalidatesTags: ['CallLogs', 'Lead', 'FollowUp', 'Dashboard'],
    }),
    reanalyzeCall: builder.mutation<Ok<CallOutcome | null>, string>({
      query: (id) => ({ url: `/outcomes/calls/${id}/analyze`, method: 'POST' }),
      invalidatesTags: ['CallLogs', 'Lead', 'FollowUp'],
    }),
    analyzePastCalls: builder.mutation<Ok<{ queued: number }>, { from: string; to: string; agent_id?: string }>({
      query: (body) => ({ url: '/outcomes/calls/analyze-past', method: 'POST', body }),
      invalidatesTags: ['CallLogs'],
    }),

    // ---------- leads ----------
    getLeads: builder.query<LeadsResponse, LeadsQuery | void>({
      query: (params) => ({ url: '/outcomes/leads', params: clean(params || {}) }),
      providesTags: ['Lead'],
    }),
    getLead: builder.query<Ok<LeadDetail>, string>({
      query: (id) => ({ url: `/outcomes/leads/${id}` }),
      providesTags: (result, error, id) => [{ type: 'Lead', id }, 'FollowUp'],
    }),
    setLeadStatus: builder.mutation<Ok<LeadInfo>, { id: string; status: string; note?: string }>({
      query: ({ id, ...body }) => ({ url: `/outcomes/leads/${id}/status`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => ['Lead', { type: 'Lead', id }, 'FollowUp', 'ContactHub'],
    }),
    unlockLead: builder.mutation<Ok<null>, string>({
      query: (id) => ({ url: `/outcomes/leads/${id}/unlock`, method: 'POST' }),
      invalidatesTags: (result, error, id) => ['Lead', { type: 'Lead', id }],
    }),
    addLeadNote: builder.mutation<Ok<{ text: string; at: string }>, { id: string; text: string }>({
      query: ({ id, ...body }) => ({ url: `/outcomes/leads/${id}/notes`, method: 'POST', body }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Lead', id }],
    }),
    setLeadTags: builder.mutation<Ok<string[]>, { id: string; tags: string[] }>({
      query: ({ id, ...body }) => ({ url: `/outcomes/leads/${id}/tags`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => ['Lead', { type: 'Lead', id }],
    }),
    bulkUpdateLeads: builder.mutation<Ok<{ updated: number }>, { ids: string[]; action: 'status' | 'owner' | 'tag'; value: string | null; note?: string }>({
      query: (body) => ({ url: '/outcomes/leads/bulk', method: 'POST', body }),
      invalidatesTags: ['Lead', 'FollowUp'],
    }),

    // ---------- follow-ups ----------
    getFollowUps: builder.query<FollowUpsResponse, FollowUpsQuery | void>({
      query: (params) => ({ url: '/outcomes/follow-ups', params: clean(params || {}) }),
      providesTags: ['FollowUp'],
    }),
    createFollowUp: builder.mutation<Ok<FollowUpRow>, { contact_id: string; due_at?: string; mode: FollowUpMode; note?: string; assigned_member_id?: string | null }>({
      query: (body) => ({ url: '/outcomes/follow-ups', method: 'POST', body }),
      invalidatesTags: ['FollowUp', 'Lead'],
    }),
    updateFollowUp: builder.mutation<Ok<FollowUpRow>, { id: string; due_at?: string; note?: string; mode?: FollowUpMode; assigned_member_id?: string | null }>({
      query: ({ id, ...body }) => ({ url: `/outcomes/follow-ups/${id}`, method: 'PUT', body }),
      invalidatesTags: ['FollowUp', 'Lead'],
    }),
    completeFollowUp: builder.mutation<Ok<FollowUpRow>, { id: string; note?: string }>({
      query: ({ id, ...body }) => ({ url: `/outcomes/follow-ups/${id}/done`, method: 'POST', body }),
      invalidatesTags: ['FollowUp', 'Lead', 'Dashboard'],
    }),
    cancelFollowUp: builder.mutation<Ok<FollowUpRow>, { id: string; note?: string }>({
      query: ({ id, ...body }) => ({ url: `/outcomes/follow-ups/${id}/cancel`, method: 'POST', body }),
      invalidatesTags: ['FollowUp', 'Lead', 'Dashboard'],
    }),
    callFollowUpNow: builder.mutation<Ok<FollowUpRow>, string>({
      query: (id) => ({ url: `/outcomes/follow-ups/${id}/call-now`, method: 'POST' }),
      invalidatesTags: ['FollowUp', 'Lead', 'CallLogs'],
    }),

    // ---------- campaigns ----------
    recallCampaign: builder.mutation<Ok<{ id: string; contacts: number; skipped: number }>, { id: string; outcome_keys: string[] }>({
      query: ({ id, ...body }) => ({ url: `/outcomes/campaigns/${id}/recall`, method: 'POST', body }),
      invalidatesTags: ['Campaign'],
    }),
  }),
})

export const {
  useGetOutcomeSettingsQuery,
  useUpdateOutcomeSettingsMutation,
  useApplyOutcomePresetMutation,
  useTestOutcomeOnCallMutation,
  useSetCallOutcomeMutation,
  useReanalyzeCallMutation,
  useAnalyzePastCallsMutation,
  useGetLeadsQuery,
  useGetLeadQuery,
  useSetLeadStatusMutation,
  useUnlockLeadMutation,
  useAddLeadNoteMutation,
  useSetLeadTagsMutation,
  useBulkUpdateLeadsMutation,
  useGetFollowUpsQuery,
  useCreateFollowUpMutation,
  useUpdateFollowUpMutation,
  useCompleteFollowUpMutation,
  useCancelFollowUpMutation,
  useCallFollowUpNowMutation,
  useRecallCampaignMutation,
} = outcomeApi
