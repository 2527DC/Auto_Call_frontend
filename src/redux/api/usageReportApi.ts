import { UsageReport } from '@/types/usageReport'
import { baseApi } from './baseApi'

export const usageReportApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getUsageReport: builder.query<UsageReport, { from: string; to: string }>({
      query: (params) => ({ url: '/usage-report', params }),
    }),
  }),
})

export const { useGetUsageReportQuery } = usageReportApi
