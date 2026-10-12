import {
  WaConversationDetail,
  WaConversationList,
  WaConversationQuery,
  WaMessage,
  WaQuickReply,
  WaSendBody,
  WaSetup,
  WaTeamMember,
  WaTemplate,
} from '@/types/whatsappInbox'
import { baseApi } from './baseApi'

export const whatsappInboxApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getWaSetup: builder.query<{ success: boolean; data: WaSetup }, void>({
      query: () => '/whatsapp-inbox/setup',
    }),
    subscribeWaWebhook: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({ url: '/whatsapp-inbox/setup/subscribe', method: 'POST' }),
    }),
    getWaConversations: builder.query<WaConversationList, WaConversationQuery>({
      query: (params) => ({ url: '/whatsapp-inbox/conversations', params }),
      providesTags: ['WhatsappConversation'],
    }),
    getWaConversation: builder.query<{ success: boolean; data: WaConversationDetail }, string>({
      query: (id) => `/whatsapp-inbox/conversations/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'WhatsappConversation', id }],
    }),
    getWaMessages: builder.query<{ success: boolean; data: WaMessage[]; has_more: boolean }, { id: string; before?: string }>({
      query: ({ id, before }) => ({ url: `/whatsapp-inbox/conversations/${id}/messages`, params: before ? { before } : undefined }),
      providesTags: (_r, _e, { id }) => [{ type: 'WhatsappMessage', id }],
    }),
    sendWaMessage: builder.mutation<{ success: boolean; data: WaMessage; message?: string }, { id: string; body: WaSendBody | FormData }>({
      query: ({ id, body }) => ({ url: `/whatsapp-inbox/conversations/${id}/messages`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'WhatsappMessage', id }, 'WhatsappConversation'],
    }),
    markWaRead: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/whatsapp-inbox/conversations/${id}/read`, method: 'POST' }),
      invalidatesTags: ['WhatsappConversation'],
    }),
    updateWaConversation: builder.mutation<{ success: boolean }, { id: string; status?: string; labels?: string[] }>({
      query: ({ id, ...body }) => ({ url: `/whatsapp-inbox/conversations/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => ['WhatsappConversation', { type: 'WhatsappMessage', id }],
    }),
    assignWaConversation: builder.mutation<{ success: boolean }, { id: string; member_id: string | null }>({
      query: ({ id, member_id }) => ({ url: `/whatsapp-inbox/conversations/${id}/assign`, method: 'POST', body: { member_id } }),
      invalidatesTags: (_r, _e, { id }) => ['WhatsappConversation', { type: 'WhatsappMessage', id }],
    }),
    setWaBot: builder.mutation<{ success: boolean }, { id: string; paused: boolean }>({
      query: ({ id, paused }) => ({ url: `/whatsapp-inbox/conversations/${id}/bot`, method: 'POST', body: { paused } }),
      invalidatesTags: (_r, _e, { id }) => ['WhatsappConversation', { type: 'WhatsappMessage', id }],
    }),
    reactWaMessage: builder.mutation<{ success: boolean; data: WaMessage }, { messageId: string; conversationId: string; emoji: string }>({
      query: ({ messageId, emoji }) => ({ url: `/whatsapp-inbox/messages/${messageId}/react`, method: 'POST', body: { emoji } }),
      invalidatesTags: (_r, _e, { conversationId }) => [{ type: 'WhatsappMessage', id: conversationId }],
    }),
    getWaTeamMembers: builder.query<{ success: boolean; data: WaTeamMember[] }, void>({
      query: () => '/whatsapp-inbox/team-members',
    }),
    getWaTemplates: builder.query<{ success: boolean; data: WaTemplate[] }, void>({
      query: () => '/whatsapp-inbox/templates',
    }),
    getWaQuickReplies: builder.query<{ success: boolean; data: WaQuickReply[] }, void>({
      query: () => '/whatsapp-inbox/quick-replies',
      providesTags: ['WhatsappQuickReply'],
    }),
    saveWaQuickReplies: builder.mutation<{ success: boolean; data: WaQuickReply[] }, WaQuickReply[]>({
      query: (quick_replies) => ({ url: '/whatsapp-inbox/quick-replies', method: 'PUT', body: { quick_replies } }),
      invalidatesTags: ['WhatsappQuickReply'],
    }),
  }),
})

export const {
  useGetWaSetupQuery,
  useSubscribeWaWebhookMutation,
  useGetWaConversationsQuery,
  useGetWaConversationQuery,
  useGetWaMessagesQuery,
  useLazyGetWaMessagesQuery,
  useSendWaMessageMutation,
  useMarkWaReadMutation,
  useUpdateWaConversationMutation,
  useAssignWaConversationMutation,
  useSetWaBotMutation,
  useReactWaMessageMutation,
  useGetWaTeamMembersQuery,
  useGetWaTemplatesQuery,
  useGetWaQuickRepliesQuery,
  useSaveWaQuickRepliesMutation,
} = whatsappInboxApi
