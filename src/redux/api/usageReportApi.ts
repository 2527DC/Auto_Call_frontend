import { AiInsightsParams, AiInsightsResponse } from '@/types/aiInsights'
import { CreditCost, UsageReport } from '@/types/usageReport'
import { baseApi } from './baseApi'

export const usageReportApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getUsageReport: builder.query<UsageReport, { from: string; to: string }>({
      query: (params) => ({ url: '/usage-report', params }),
    }),
    getCreditCost: builder.query<CreditCost, void>({
      query: () => '/usage-report/credit-cost',
    }),
    getAiInsights: builder.query<AiInsightsResponse, AiInsightsParams>({
      query: (params) => ({ url: '/usage-report/ai-insights', params }),
    }),
  }),
})

export const { useGetUsageReportQuery, useGetCreditCostQuery, useGetAiInsightsQuery } = usageReportApi

