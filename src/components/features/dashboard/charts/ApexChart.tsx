'use client'

import dynamic from 'next/dynamic'

// ApexCharts needs the browser, so it is loaded on the client only.
export const ApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-lg bg-subcard" />,
})
