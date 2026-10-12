import { CURRENCY_SYMBOL } from '@/lib/currency'
import { ROUTES } from '@/constants/routes';
import { useAppSelector } from '@/redux/hooks';
import { WelcomeAndCountersProps } from '@/types/dashboard';
import { IndianRupee, PhoneCall, PhoneIncoming, Repeat, Timer, UserPlus } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StatsCard } from './StatsCard';
import { WelcomeCard } from './WelcomeCard';

export const WelcomeAndCounters: React.FC<WelcomeAndCountersProps> = ({ statistics, trends }) => {
  const { t } = useTranslation();
  const user = useAppSelector((state: any) => state.auth?.user);
  const userName = user?.name || t('admin');
  const summary = trends?.summary;
  const compareLabel = trends?.compareLabel;
  const answerRate = summary?.calls.current ? (summary.answered.current / summary.calls.current) * 100 : 0;

  const cards = [
    {
      title: t('revenue', 'Revenue'),
      value: summary?.revenue.current ?? statistics.totalRevenue ?? 0,
      description: t('all_time_earnings'),
      delta: summary?.revenue,
      icon: IndianRupee,
      colorClass: 'from-primary/10 to-primary/10 text-primary border-primary/20',
      glowClass: 'shadow-primary/5 hover:border-primary/30',
      prefix: CURRENCY_SYMBOL,
      href: ROUTES.TRANSACTIONS,
    },
    {
      title: t('monthly_recurring_revenue_short', 'Monthly recurring'),
      value: summary?.mrr ?? 0,
      description: `${summary?.recurringSubscribers ?? statistics.activeSubscribers ?? 0} ${t('recurring_subscriptions', 'recurring subscriptions')}`,
      icon: Repeat,
      colorClass: 'from-incoming-color/10 to-incoming-color/10 text-incoming-color border-incoming-color/20',
      glowClass: 'shadow-incoming-color/5 hover:border-incoming-color/30',
      prefix: CURRENCY_SYMBOL,
      href: ROUTES.SUBSCRIPTIONS,
    },
    {
      title: t('new_sign_ups', 'New sign-ups'),
      value: summary?.signups.current ?? statistics.newUsersThisWeek ?? 0,
      description: t('weekly_onboarding'),
      delta: summary?.signups,
      icon: UserPlus,
      colorClass: 'from-build-color/10 to-build-color/10 text-build-color border-build-color/20',
      glowClass: 'shadow-build-color/5 hover:border-build-color/30',
      href: ROUTES.MEMBERS,
    },
    {
      title: t('platform_calls', 'Platform calls'),
      value: summary?.calls.current ?? 0,
      description: t('all_clients_calls', 'Calls across all clients'),
      delta: summary?.calls,
      icon: PhoneCall,
      colorClass: 'from-campaign-color/10 to-campaign-color/10 text-campaign-color border-campaign-color/20',
      glowClass: 'shadow-campaign-color/5 hover:border-campaign-color/30',
      href: ROUTES.COST_REPORT,
    },
    {
      title: t('call_minutes', 'Call minutes'),
      value: summary?.minutes.current ?? 0,
      decimals: 1,
      description: t('all_clients_minutes', 'Talk time across all clients'),
      delta: summary?.minutes,
      icon: Timer,
      colorClass: 'from-outgoing-color/10 to-outgoing-color/10 text-outgoing-color border-outgoing-color/20',
      glowClass: 'shadow-outgoing-color/5 hover:border-outgoing-color/30',
      href: ROUTES.COST_REPORT,
    },
    {
      title: t('answer_rate', 'Answer rate'),
      value: Math.round(answerRate * 10) / 10,
      decimals: 1,
      suffix: '%',
      description: `${summary?.answered.current ?? 0} ${t('of', 'of')} ${summary?.calls.current ?? 0} ${t('calls_answered', 'calls answered')}`,
      icon: PhoneIncoming,
      colorClass: 'from-primary/10 to-primary/10 text-primary border-primary/20',
      glowClass: 'shadow-primary/5 hover:border-primary/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
      {/* Left Side: Welcome Card */}
      <div className="lg:col-span-2 flex">
        <WelcomeCard
          badge={t('autocall_workspace')}
          title={`${t('hello')}, ${userName}`}
          subtitle={t('admin_subtitle')}
          gradientClass=""
          className="sm:p-6 p-4 flex flex-col justify-between w-full h-full"
        />
      </div>

      {/* Right Side: 6 KPI cards for the selected period */}
      <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <StatsCard key={card.title} {...card} compareLabel={compareLabel} />
        ))}
      </div>
    </div>
  );
};

export default WelcomeAndCounters;
