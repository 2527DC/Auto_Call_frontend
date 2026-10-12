import {
  BuilderOptions,
  FlowRun,
  FlowTemplateInfo,
  FlowValidation,
  SimResult,
  WaAiSettings,
  WhatsappFlow,
  WhatsappFlowSummary,
} from '@/types/whatsappAutomation'
import { baseApi } from './baseApi'

type FlowDefinition = Pick<WhatsappFlow, 'nodes' | 'edges'> & Partial<Pick<WhatsappFlow, 'name' | 'description' | 'trigger' | 'settings' | 'priority'>>

export const whatsappAutomationApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getWaFlows: builder.query<{ success: boolean; data: WhatsappFlowSummary[]; templates: FlowTemplateInfo[] }, void>({
      query: () => '/whatsapp-automations/flows',
      providesTags: ['WhatsappFlow'],
    }),
    getWaFlow: builder.query<{ success: boolean; data: WhatsappFlow; validation: FlowValidation }, string>({
      query: (id) => `/whatsapp-automations/flows/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'WhatsappFlow', id }],
    }),
    createWaFlow: builder.mutation<{ success: boolean; data: WhatsappFlow }, { name?: string; template?: string }>({
      query: (body) => ({ url: '/whatsapp-automations/flows', method: 'POST', body }),
      invalidatesTags: ['WhatsappFlow'],
    }),
    updateWaFlow: builder.mutation<{ success: boolean; data: WhatsappFlow; validation: FlowValidation }, { id: string; body: Partial<FlowDefinition> }>({
      query: ({ id, body }) => ({ url: `/whatsapp-automations/flows/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => ['WhatsappFlow', { type: 'WhatsappFlow', id }],
    }),
    setWaFlowStatus: builder.mutation<{ success: boolean; data: WhatsappFlow; validation: FlowValidation }, { id: string; status: WhatsappFlow['status'] }>({
      query: ({ id, status }) => ({ url: `/whatsapp-automations/flows/${id}/status`, method: 'POST', body: { status } }),
      invalidatesTags: (_r, _e, { id }) => ['WhatsappFlow', { type: 'WhatsappFlow', id }],
    }),
    duplicateWaFlow: builder.mutation<{ success: boolean; data: WhatsappFlow }, string>({
      query: (id) => ({ url: `/whatsapp-automations/flows/${id}/duplicate`, method: 'POST' }),
      invalidatesTags: ['WhatsappFlow'],
    }),
    deleteWaFlow: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/whatsapp-automations/flows/${id}`, method: 'DELETE' }),
      invalidatesTags: ['WhatsappFlow'],
    }),
    getWaFlowRuns: builder.query<{ success: boolean; data: FlowRun[] }, string>({
      query: (id) => `/whatsapp-automations/flows/${id}/runs`,
    }),
    simulateWaFlow: builder.mutation<{ success: boolean; data: SimResult }, { id: string; run_id?: string | null; text: string; interactive_id?: string | null; definition?: FlowDefinition }>({
      query: ({ id, ...body }) => ({ url: `/whatsapp-automations/flows/${id}/simulate`, method: 'POST', body }),
    }),
    getWaBuilderOptions: builder.query<{ success: boolean; data: BuilderOptions }, void>({
      query: () => '/whatsapp-automations/options',
    }),
    uploadWaFlowMedia: builder.mutation<{ success: boolean; data: { url: string; type: 'image' | 'video' | 'document'; filename: string; mime_type: string } }, FormData>({
      query: (body) => ({ url: '/whatsapp-automations/media', method: 'POST', body }),
    }),
    getWaAiSettings: builder.query<{ success: boolean; data: WaAiSettings }, void>({
      query: () => '/whatsapp-automations/ai-settings',
      providesTags: ['WhatsappAiSettings'],
    }),
    saveWaAiSettings: builder.mutation<{ success: boolean; data: WaAiSettings }, Omit<WaAiSettings, 'model'>>({
      query: (body) => ({ url: '/whatsapp-automations/ai-settings', method: 'PUT', body }),
      invalidatesTags: ['WhatsappAiSettings'],
    }),
    testWaAi: builder.mutation<{ success: boolean; data: { reply: string }; message?: string }, { message: string; history: { role: 'user' | 'assistant'; content: string }[] }>({
      query: (body) => ({ url: '/whatsapp-automations/ai-settings/test', method: 'POST', body }),
    }),
  }),
})

export const {
  useGetWaFlowsQuery,
  useGetWaFlowQuery,
  useCreateWaFlowMutation,
  useUpdateWaFlowMutation,
  useSetWaFlowStatusMutation,
  useDuplicateWaFlowMutation,
  useDeleteWaFlowMutation,
  useGetWaFlowRunsQuery,
  useSimulateWaFlowMutation,
  useGetWaBuilderOptionsQuery,
  useUploadWaFlowMediaMutation,
  useGetWaAiSettingsQuery,
  useSaveWaAiSettingsMutation,
  useTestWaAiMutation,
} = whatsappAutomationApi
