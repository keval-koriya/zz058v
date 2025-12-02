import { formatNumber, formatCurrency } from '../lib/utils';
import type { ChannelStats } from '../types/channel';
import { Users, DollarSign, Eye, TrendingUp, CheckCircle, Video } from 'lucide-react';

interface StatsCardsProps {
  stats: ChannelStats;
  loading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  loading?: boolean;
}

function StatCard({ title, value, subtitle, icon, loading }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {loading ? (
            <div className="h-7 w-20 animate-pulse rounded bg-gray-200 mt-2" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          )}
          {subtitle && !loading && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      <StatCard
        title="Total Channels"
        value={formatNumber(stats.totalChannels)}
        icon={<Video className="h-5 w-5" />}
        loading={loading}
      />
      <StatCard
        title="Subscribers"
        value={formatNumber(stats.totalSubscribers)}
        subtitle={`Avg: ${formatNumber(stats.avgSubscribers)}`}
        icon={<Users className="h-5 w-5" />}
        loading={loading}
      />
      <StatCard
        title="Revenue"
        value={formatCurrency(stats.totalRevenue)}
        subtitle={`Avg: ${formatCurrency(stats.avgMonthlyRevenue)}/mo`}
        icon={<DollarSign className="h-5 w-5" />}
        loading={loading}
      />
      <StatCard
        title="Total Views"
        value={formatNumber(stats.totalViews)}
        icon={<Eye className="h-5 w-5" />}
        loading={loading}
      />
      <StatCard
        title="Avg RPM"
        value={formatCurrency(stats.avgRpm)}
        icon={<TrendingUp className="h-5 w-5" />}
        loading={loading}
      />
      <StatCard
        title="Monetized"
        value={`${stats.monetizedCount}/${stats.totalChannels}`}
        subtitle={`${stats.facelessCount} faceless`}
        icon={<CheckCircle className="h-5 w-5" />}
        loading={loading}
      />
    </div>
  );
}
