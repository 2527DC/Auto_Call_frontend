import { EstimatorRates, PriceQuote, PriceQuoteListItem, PriceQuotePayload, QuoteStatus } from '@/types/priceEstimator'
import { baseApi } from './baseApi'

export const priceEstimatorApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getEstimatorRates: builder.query<EstimatorRates, void>({
      query: () => '/price-estimator/rates',
    }),
    getPriceQuotes: builder.query<{ success: boolean; data: PriceQuoteListItem[] }, { search?: string; status?: QuoteStatus }>({
      query: (params) => ({ url: '/price-estimator/quotes', params }),
      providesTags: ['PriceQuote'],
    }),
    getPriceQuote: builder.query<{ success: boolean; data: PriceQuote }, string>({
      query: (id) => `/price-estimator/quotes/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'PriceQuote', id }],
    }),
    createPriceQuote: builder.mutation<{ success: boolean; message: string; data: PriceQuote }, PriceQuotePayload>({
      query: (body) => ({ url: '/price-estimator/quotes', method: 'POST', body }),
      invalidatesTags: ['PriceQuote'],
    }),
    updatePriceQuote: builder.mutation<{ success: boolean; message: string; data: PriceQuote }, { id: string; body: PriceQuotePayload }>({
      query: ({ id, body }) => ({ url: `/price-estimator/quotes/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => ['PriceQuote', { type: 'PriceQuote', id }],
    }),
    deletePriceQuote: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({ url: `/price-estimator/quotes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['PriceQuote'],
    }),
  }),
})

export const {
  useGetEstimatorRatesQuery,
  useGetPriceQuotesQuery,
  useLazyGetPriceQuoteQuery,
  useCreatePriceQuoteMutation,
  useUpdatePriceQuoteMutation,
  useDeletePriceQuoteMutation,
} = priceEstimatorApi
