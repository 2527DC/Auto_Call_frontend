import { ClientProviderKeys, VoiceModelsResponse, VoiceResponse } from '@/types/voice';
import { baseApi } from './baseApi'

export const voiceApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // scope 'all' (admins): hidden voices too, so they can be switched on.
    getVoices: builder.query<VoiceResponse, { scope?: 'all' } | void>({
      query: (arg) => ({
        url: '/voices',
        params: arg?.scope ? { scope: arg.scope } : undefined,
      }),
      providesTags: ['Voice'],
    }),
    syncVoices: builder.mutation<{ success: boolean; message: string; data?: any }, void>({
      query: () => ({
        url: '/voices/sync',
        method: 'GET',
      }),
      invalidatesTags: ['Voice'],
    }),
    updateVoiceStatus: builder.mutation<{ success: boolean }, { voice_id: string; status: 'active' | 'inactive' }>({
      query: ({ voice_id, status }) => ({
        url: `/voices/${voice_id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Voice'],
    }),
    // ElevenLabs voice models: all for admins (scope 'all'), else the allowed ones.
    getVoiceModels: builder.query<VoiceModelsResponse, { scope?: 'all' } | void>({
      query: (arg) => ({
        url: '/voices/models',
        params: arg?.scope ? { scope: arg.scope } : undefined,
      }),
      providesTags: ['Voice'],
    }),
    getClientProviderKeys: builder.query<{ success: boolean; data: ClientProviderKeys }, string>({
      query: (userId) => ({ url: `/user/${userId}/provider-keys` }),
    }),
    updateClientProviderKeys: builder.mutation<{ success: boolean; message: string }, { userId: string } & Partial<ClientProviderKeys>>({
      query: ({ userId, ...body }) => ({
        url: `/user/${userId}/provider-keys`,
        method: 'PUT',
        body,
      }),
    }),
  }),
})

export const {
  useGetVoicesQuery,
  useSyncVoicesMutation,
  useUpdateVoiceStatusMutation,
  useGetVoiceModelsQuery,
  useGetClientProviderKeysQuery,
  useUpdateClientProviderKeysMutation,
} = voiceApi
