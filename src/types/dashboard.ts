import { LucideIcon } from "lucide-react"
import { Widget, WidgetAnalyticsData } from "./widget"

export interface AdminDashboardProps {
    stats: {
        statistics: {
            newUsersThisWeek: number
            totalRevenue: number
            activeSubscribers: number
            totalFlowsOfCurrentUser: number
            totalTemplatesOfCurrentUser: number
            totalContactOfCurrentUser: number
            totalAgentOfCurrentUser?: number
            totalSmsAgentOfCurrentUser?: number
            totalCallsOfCurrentUser?: number
            totalTeamsAcrossAllUser?: number
            totalCampaignsOfCurrentUser?: number
            totalSmsCampaignOfCurrentUser?: number
            totalSmsTemplateOfCurrentUser?: number
        }
        charts: {
            monthWiseRevenueChart: Array<{ month: string; revenue: number }>
            currentWeekCallChart: Array<{ day: string; all: number; incoming: number; outgoing: number }>
            allTimeAgentPieChart?: {
                agent: number
                sms_agent: number
            }
        }
        tables: {
            recentRegisteredUsers: UserItem[]
            recentCallsOfCurrentUser: CallItem[]
            recentCampaigns: CampaignItem[]
            systemFlow: FlowItem[]
            recentContactOfCurrentUser?: any[]
            recentSmsCampaignsOfCurrentUser?: any[]
        }
        trends?: AdminTrends
    }
}

// A total for the chosen period and for the same stretch of the period before it.
export interface PeriodValue {
    current: number
    previous: number
}

export type TrendBucket = 'hour' | 'day' | 'month'

export interface AdminTrends {
    bucket: TrendBucket
    compareLabel: string
    trend: Array<{
        label: string
        revenue: number
        payments: number
        signups: number
        inbound: number
        outbound: number
        answered: number
        minutes: number
    }>
    revenueByPlan: Array<{ name: string; revenue: number; payments: number }>
    summary: {
        revenue: PeriodValue
        payments: PeriodValue
        signups: PeriodValue
        calls: PeriodValue
        minutes: PeriodValue
        answered: PeriodValue
        mrr: number
        recurringSubscribers: number
    }
}

export interface UserTrends {
    bucket: TrendBucket
    compareLabel: string
    trend: Array<{
        label: string
        inbound: number
        outbound: number
        answered: number
        minutes: number
        aiCampaigns: number
        smsCampaigns: number
    }>
    summary: {
        calls: PeriodValue
        minutes: PeriodValue
        answered: PeriodValue
        appointments: PeriodValue
    }
}

export interface CreditStats {
    total_credits: number
    used_credits: number
    available_credits: number
    monthly_credits_used?: number
}

export type AdminDashboardStats = AdminDashboardProps['stats'];

export interface UserDashboardProps {
    stats: {
        statistics: {
            totalAppointmentsBooked: number
            totalFormSubmissions: number
            totalKnowledgebase: number
            totalTemplatesCreated: number
            totalContacts: number
            totalFlowsCreated: number
            totalIncomingAgent: number
            totalFlowTypeAgent: number
            totalActiveCampaigns: number
            totalCalls: number
            totalAiAgent: number
            totalSmsAgents: number
        }
        charts: {
            currentWeekCallChart: Array<{ day: string; all: number; incoming: number; outgoing: number }>
            allTimeCallPieChart: {
                incoming: number
                outgoing: number
                campaign: number
            }
            currentWeekCampaignChart: Array<{ day: string;[key: string]: any }>
            weeklyCampaignVolumeChart: Array<{ week: string; campaigns: number }>
        }
        tables: {
            recentCampaigns: CampaignItem[]
            recentContacts: import('./contact').Contact[]
            recentSmsCampaigns: any[]
            recentTeamMembers: any[]
            recentActivity: any[]
        }
        credits?: CreditStats
        trends?: UserTrends
    }
}

export interface CallItem {
    to_phone_number?: string;
    from_phone_number?: string;
    to_number?: string;
    from_number?: string;
    direction?: string;
    duration?: number;
    status?: string;
}

export interface DashboardChartCardProps {
    title: string
    category: string
    badgeText?: string
    badgeIcon?: LucideIcon
    badgeColorClass?: string
    chartType: 'area' | 'bar' | 'donut' | 'line'
    chartOptions: any
    chartSeries: any
    height?: string | number
    width?: string | number
    colSpan?: string
}
export interface UserItem {
    avatar?: string;
    name?: string;
    email?: string;
    isActive?: boolean;
    roleId?: {
        name?: string;
    };
}


export interface StatsCardProps {
    title: string
    value: number | string
    description: string
    icon: LucideIcon
    colorClass: string
    glowClass: string
    prefix?: string
    suffix?: string
    decimals?: number
    href?: string
    delta?: PeriodValue
    compareLabel?: string
}

export interface UserChartsAndTablesProps {
    stats: UserDashboardProps['stats']
    cardVariants: any
    t: any
}

export interface UserCountersProps {
    counterCards: Array<{
        title: string
        value: number | string
        description: string
        icon: any
        colorClass: string
        glowClass: string
        delta?: PeriodValue
        compareLabel?: string
    }>
}

export interface UserHeaderSectionProps {
    userName: string
    quickAccessItems: Array<{
        title: string
        desc: string
        icon: any
        path: string
        permission: string
    }>
    sub: any
    router: any | Record<string, unknown>
    t: any
    cardVariants: any
}

export interface WelcomeAndCountersProps {
    trends?: AdminTrends;
    statistics: {
        totalRevenue?: number;
        activeSubscribers?: number;
        newUsersThisWeek?: number;
        totalFlowsOfCurrentUser?: number;
        totalTemplatesOfCurrentUser?: number;
        totalContactOfCurrentUser?: number;
    };
}
export interface WelcomeCardProps {
    badge: string
    title: string
    subtitle: string
    gradientClass: string
    glowClass?: string
    className?: string
}

export interface FlowItem {
    name?: string;
    language?: string;
    flowStatus?: string;
}

export interface CampaignItem {
    name?: string;
    typeId?: {
        name?: string;
    };
    phoneNumberId?: {
        phone_number?: string;
    };
    campaignStatus?: string;
}

export interface WorkflowsAndCampaignsProps {
    systemFlow: FlowItem[];
    recentCampaigns: CampaignItem[];
    cardVariants: any;
}

export interface LeadCaptureFormDetailProps {
    id?: string
}

export interface EmbedModalProps {
    isOpen: boolean
    onClose: () => void
    embedCode: string
    widgetName?: string
}

export interface WidgetFormProps {
    initialValues: Partial<Widget>
    onSubmit: (values: Partial<Widget>) => void
    isLoading?: boolean
    onValuesChange?: (values: Partial<Widget>) => void
}

export interface WidgetManagerLayoutProps {
    title: React.ReactNode
    subtitle?: string
    initialValues: Partial<Widget>
    onSubmit: (values: Partial<Widget>) => Promise<void>
    isLoading: boolean
}

export
    interface WidgetPreviewProps {
    widgetData: Partial<Widget>
}


export interface DashboardDateFilterProps {
    onFilterChange: (params: { dateRange: string; startDate?: string; endDate?: string }) => void;
}

export interface AdminAdditionalCountersProps {
    statistics: AdminDashboardStats['statistics'];
}

export interface TeamMemberDashboardProps {
    stats: any
    onSearchChange?: (search: string) => void
}

export interface AdminLowerSectionProps {
    recentContacts: AdminDashboardStats['tables']['recentContactOfCurrentUser'];
    recentSmsCampaigns: AdminDashboardStats['tables']['recentSmsCampaignsOfCurrentUser'];
    agentCounts: { agents: number; smsAgents: number };
    cardVariants: any;
}

export interface WidgetAnalyticsCardsProps {
    analytics?: WidgetAnalyticsData
    isLoading: boolean
}