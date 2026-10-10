import {
  ChatRequest,
  ChatResponse,
  KnowledgeListResponse,
  SystemAssistantAdminConfig,
  SystemAssistantKnowledge,
  SystemAssistantPublicConfig
} from '@/types/system-assistant';
import { baseApi } from './baseApi';

export const systemAssistantApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Member / In-app bot endpoints
    getAssistantConfig: builder.query<{ success: boolean; data: SystemAssistantPublicConfig }, void>({
      query: () => ({
        url: '/system-assistant/config',
        method: 'GET'
      }),
      providesTags: ['SystemAssistant']
    }),

    sendAssistantMessage: builder.mutation<ChatResponse, ChatRequest>({
      query: (body) => ({
        url: '/system-assistant/chat',
        method: 'POST',
        body
      })
    }),

    // Admin endpoints
    getAdminAssistantConfig: builder.query<{ success: boolean; data: SystemAssistantAdminConfig }, void>({
      query: () => ({
        url: '/system-assistant/admin/config',
        method: 'GET'
      }),
      providesTags: ['SystemAssistant']
    }),

    updateAdminAssistantConfig: builder.mutation<
      { success: boolean; data: SystemAssistantAdminConfig; message: string },
      Partial<SystemAssistantAdminConfig>
    >({
      query: (body) => ({
        url: '/system-assistant/admin/config',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['SystemAssistant']
    }),

    getAdminKnowledge: builder.query<
      KnowledgeListResponse,
      { page?: number; limit?: number; search?: string; category?: string; is_active?: boolean | string }
    >({
      query: (params) => ({
        url: '/system-assistant/admin/knowledge',
        method: 'GET',
        params
      }),
      providesTags: ['SystemAssistant']
    }),

    getAdminKnowledgeById: builder.query<{ success: boolean; data: SystemAssistantKnowledge }, string>({
      query: (id) => ({
        url: `/system-assistant/admin/knowledge/${id}`,
        method: 'GET'
      }),
      providesTags: (result, error, id) => [{ type: 'SystemAssistant', id }]
    }),

    createAdminKnowledge: builder.mutation<
      { success: boolean; data: SystemAssistantKnowledge; message: string },
      Partial<SystemAssistantKnowledge>
    >({
      query: (body) => ({
        url: '/system-assistant/admin/knowledge',
        method: 'POST',
        body
      }),
      invalidatesTags: ['SystemAssistant']
    }),

    updateAdminKnowledge: builder.mutation<
      { success: boolean; data: SystemAssistantKnowledge; message: string },
      { id: string; data: Partial<SystemAssistantKnowledge> }
    >({
      query: ({ id, data }) => ({
        url: `/system-assistant/admin/knowledge/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['SystemAssistant']
    }),

    deleteAdminKnowledge: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/system-assistant/admin/knowledge/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['SystemAssistant']
    }),

    bulkDeleteAdminKnowledge: builder.mutation<{ success: boolean; message: string }, string[]>({
      query: (ids) => ({
        url: '/system-assistant/admin/knowledge/bulk-delete',
        method: 'DELETE',
        body: { ids }
      }),
      invalidatesTags: ['SystemAssistant']
    })
  })
});

export const {
  useGetAssistantConfigQuery,
  useSendAssistantMessageMutation,
  useGetAdminAssistantConfigQuery,
  useUpdateAdminAssistantConfigMutation,
  useGetAdminKnowledgeQuery,
  useGetAdminKnowledgeByIdQuery,
  useCreateAdminKnowledgeMutation,
  useUpdateAdminKnowledgeMutation,
  useDeleteAdminKnowledgeMutation,
  useBulkDeleteAdminKnowledgeMutation
} = systemAssistantApi;
