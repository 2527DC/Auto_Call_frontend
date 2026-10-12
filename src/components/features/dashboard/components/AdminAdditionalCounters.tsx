import { ROUTES } from '@/constants/routes';
import { AdminAdditionalCountersProps } from '@/types/dashboard';
import { motion } from 'framer-motion';
import { Bot, Contact2, FileText, GitBranch, Megaphone, MessageSquare, Network, Send } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import CountUp from "react-countup";
import { useTranslation } from 'react-i18next';

// Counts of what the admin's own workspace holds, as compact tiles.
export const AdminAdditionalCounters: React.FC<AdminAdditionalCountersProps> = ({ statistics }) => {
  const { t } = useTranslation();

  const items = [
    { title: t('total_ai_agents'), value: statistics.totalAgentOfCurrentUser || 0, icon: Bot, colorClass: 'bg-primary/10 text-primary', href: ROUTES.AI_ASSISTANTS },
    { title: t('total_sms_agents'), value: statistics.totalSmsAgentOfCurrentUser || 0, icon: MessageSquare, colorClass: 'bg-incoming-color/10 text-incoming-color', href: ROUTES.SMS_AGENTS },
    { title: t('total_flows'), value: statistics.totalFlowsOfCurrentUser || 0, icon: GitBranch, colorClass: 'bg-campaign-color/10 text-campaign-color', href: ROUTES.WORKFLOW_BUILDER },
    { title: t('total_templates'), value: statistics.totalTemplatesOfCurrentUser || 0, icon: FileText, colorClass: 'bg-outgoing-color/10 text-outgoing-color', href: ROUTES.PROMPT_TEMPLATES },
    { title: t('saved_contacts'), value: statistics.totalContactOfCurrentUser || 0, icon: Contact2, colorClass: 'bg-primary/10 text-primary', href: ROUTES.CONTACT_HUB },
    { title: t('total_teams'), value: statistics.totalTeamsAcrossAllUser || 0, icon: Network, colorClass: 'bg-build-color/10 text-build-color', href: ROUTES.TEAMS },
    { title: t('total_campaigns'), value: statistics.totalCampaignsOfCurrentUser || 0, icon: Megaphone, colorClass: 'bg-campaign-color/10 text-campaign-color', href: ROUTES.CAMPAIGNS },
    { title: t('total_sms_campaigns'), value: statistics.totalSmsCampaignOfCurrentUser || 0, icon: Send, colorClass: 'bg-outgoing-color/10 text-outgoing-color', href: ROUTES.SMS_CAMPAIGNS },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.section variants={containerVariants} className="space-y-3">
      <h2 className="text-base font-semibold text-title tracking-tight">{t('your_workspace', 'Your workspace')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 2xl:grid-cols-8 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className="group flex items-center gap-3 rounded-radius border border-input-border-color bg-bg-card p-3 transition-colors hover:border-primary/30"
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.colorClass} transition-transform duration-300 group-hover:scale-110`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold leading-tight text-title">
                  <CountUp end={item.value} duration={1.5} formattingFn={(n) => n.toLocaleString('en-IN')} />
                </div>
                <div className="truncate text-xs font-medium text-subtitle-color">{item.title}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </motion.section>
  );
};
